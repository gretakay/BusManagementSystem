using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BusManagementSystem.DTOs;
using BusManagementSystem.Models;
using BusManagementSystem.Data;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            try
            {
                ApplicationUser? user = null;

                // 先嘗試通過學號查找 Person（學員），然後找對應的 ApplicationUser
                if (!request.UserIdentifier.Contains("@"))
                {
                    // 通過學號查找 Person
                    var person = await _context.People
                        .FirstOrDefaultAsync(p => p.StudentId == request.UserIdentifier && p.IsActive);
                    
                    if (person != null)
                    {
                        // 學員存在，但還沒有對應的 ApplicationUser，需要先建立或查找
                        user = await _userManager.Users
                            .FirstOrDefaultAsync(u => u.StudentId == request.UserIdentifier);
                        
                        // 如果找不到對應的 User，建立一個臨時的（僅用於登入驗證）
                        if (user == null)
                        {
                            // 對於學員領隊，不需要建立完整的 ApplicationUser
                            // 直接使用學號進行驗證
                        }
                    }
                }
                
                // 如果還沒找到 user，嘗試其他方式
                if (user == null)
                {
                    if (request.UserIdentifier.Contains("@"))
                    {
                        // Email 登入
                        user = await _userManager.FindByEmailAsync(request.UserIdentifier);
                    }
                    else
                    {
                        // Username 登入
                        user = await _userManager.FindByNameAsync(request.UserIdentifier);
                    }
                }

                // 檢查是否為領隊（基於 Person 的 TripLeader 指派）
                var today = DateTime.UtcNow.Date;
                var leaderTrips = await _context.TripLeaders
                    .Include(tl => tl.Trip)
                    .Include(tl => tl.Person)
                    .Where(tl => tl.Person.StudentId == request.UserIdentifier && 
                                 tl.IsActive &&
                                 tl.Trip.StartDate.Date >= today.AddDays(-1) && // 行程結束後1天內
                                 tl.Trip.StartDate.Date <= today.AddDays(30)) // 未來30天內的行程
                    .ToListAsync();

                bool isLeaderForAnyTrip = leaderTrips.Any();

                // 驗證密碼邏輯
                if (isLeaderForAnyTrip)
                {
                    // 被指派為領隊的學員，用學號登入不需要密碼
                    // 檢查是否在允許的登入時間範圍內
                    var canLogin = leaderTrips.Any(tl => tl.CanLoginOnDate(today));
                    if (!canLogin)
                    {
                        var nextTripDate = leaderTrips.OrderBy(tl => tl.Trip.StartDate).First().Trip.StartDate.Date;
                        var loginStartDate = nextTripDate.AddDays(-3);
                        return Unauthorized(new { 
                            message = $"領隊只能在行程前3天到行程後1天內登入。最近行程日期：{nextTripDate:yyyy-MM-dd}，可登入日期：{loginStartDate:yyyy-MM-dd}" 
                        });
                    }

                    // 為領隊學員建立臨時 user 物件（如果不存在）
                    if (user == null)
                    {
                        var person = leaderTrips.First().Person;
                        user = new ApplicationUser
                        {
                            Id = Guid.NewGuid().ToString(),
                            UserName = person.StudentId,
                            StudentId = person.StudentId,
                            DisplayName = person.Name,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        // 注意：這是臨時物件，不存入資料庫
                    }

                    _logger.LogInformation("Leader {StudentId} logged in without password for trips: {TripNames}", 
                        request.UserIdentifier, string.Join(", ", leaderTrips.Select(t => t.Trip.Name)));
                }
                else
                {
                    // 非領隊用戶必須存在於 ApplicationUser 中且需要密碼
                    if (user == null || !user.IsActive)
                    {
                        return Unauthorized(new { message = "Invalid credentials" });
                    }

                    if (string.IsNullOrEmpty(request.Password))
                    {
                        return BadRequest(new { message = "Password is required" });
                    }

                    var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
                    if (!result.Succeeded)
                    {
                        return Unauthorized(new { message = "Invalid credentials" });
                    }
                }

                // Update last login time
                user.LastLoginAt = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                // 獲取用戶角色，包含動態的領隊角色
                var userRoles = await _userManager.GetRolesAsync(user);
                var allRoles = userRoles.ToList();

                // 如果是領隊，添加 Leader 角色到 token 中
                if (isLeaderForAnyTrip)
                {
                    if (!allRoles.Contains("Leader"))
                    {
                        allRoles.Add("Leader");
                    }
                }

                // Generate JWT token
                var token = await GenerateJwtToken(user, allRoles);

                var response = new LoginResponse
                {
                    Token = token,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(GetJwtExpiryMinutes()),
                    User = new UserInfo
                    {
                        Id = user.Id,
                        Email = user.Email ?? user.UserName!, // 如果沒有 email 則使用 username
                        DisplayName = user.DisplayName,
                        Roles = allRoles
                    }
                };

                _logger.LogInformation("User {UserIdentifier} logged in successfully", request.UserIdentifier);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for {UserIdentifier}", request.UserIdentifier);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                await _signInManager.SignOutAsync();
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserInfo>> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                {
                    return Unauthorized();
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return Unauthorized();
                }

                var userInfo = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email ?? user.UserName!, // 如果沒有 email 則使用 username
                    DisplayName = user.DisplayName,
                    Roles = (await _userManager.GetRolesAsync(user)).ToList()
                };

                return Ok(userInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user, IList<string>? additionalRoles = null)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is required");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var roles = await _userManager.GetRolesAsync(user);
            var allRoles = roles.ToList();
            
            // 合併額外的角色
            if (additionalRoles != null)
            {
                foreach (var role in additionalRoles)
                {
                    if (!allRoles.Contains(role))
                    {
                        allRoles.Add(role);
                    }
                }
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.DisplayName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            // 只有在用戶有 email 的情況下才添加 email claim
            if (!string.IsNullOrEmpty(user.Email))
            {
                claims.Add(new Claim(ClaimTypes.Email, user.Email));
            }

            foreach (var role in allRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(GetJwtExpiryMinutes()),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private int GetJwtExpiryMinutes()
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            return int.Parse(jwtSettings["ExpiryMinutes"] ?? "60");
        }
    }
}