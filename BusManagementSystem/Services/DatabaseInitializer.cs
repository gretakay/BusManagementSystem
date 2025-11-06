using Microsoft.AspNetCore.Identity;
using BusManagementSystem.Models;
using BusManagementSystem.Data;

namespace BusManagementSystem.Services
{
    public class DatabaseInitializer
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<DatabaseInitializer> _logger;

        public DatabaseInitializer(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<DatabaseInitializer> logger)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            try
            {
                // 建立角色
                await CreateRolesAsync();

                // 建立預設使用者
                await CreateDefaultUsersAsync();

                // 建立測試資料
                await CreateSampleDataAsync();

                _logger.LogInformation("Database seeding completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while seeding database");
                throw;
            }
        }

        private async Task CreateRolesAsync()
        {
            var roles = new[] { "Leader", "AdminRead", "AdminWrite", "SysAdmin" };

            foreach (var roleName in roles)
            {
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    var role = new IdentityRole(roleName);
                    await _roleManager.CreateAsync(role);
                    _logger.LogInformation("Created role: {RoleName}", roleName);
                }
            }
        }

        private async Task CreateDefaultUsersAsync()
        {
            // 建立系統管理員
            await CreateUserIfNotExists(
                "sysadmin",
                "123",
                "系統管理員",
                "SysAdmin"
            );

            // 建立管理員（讀寫）
            await CreateUserIfNotExists(
                "admin",
                "123",
                "管理員",
                "AdminWrite"
            );

            // 建立管理員（只讀）
            await CreateUserIfNotExists(
                "readonly",
                "123",
                "只讀管理員",
                "AdminRead"
            );

            // 不再建立領隊帳號，領隊權限通過 TripLeader 指派產生
        }

        private async Task CreateUserIfNotExists(string emailOrUsername, string password, string displayName, string roleName)
        {
            // 如果是 email 格式，則用 email 查找，否則用 username 查找
            ApplicationUser? user = null;
            if (emailOrUsername.Contains("@"))
            {
                user = await _userManager.FindByEmailAsync(emailOrUsername);
            }
            else
            {
                user = await _userManager.FindByNameAsync(emailOrUsername);
            }

            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = emailOrUsername,
                    Email = emailOrUsername.Contains("@") ? emailOrUsername : null, // 如果不是 email 格式則設為 null
                    DisplayName = displayName,
                    EmailConfirmed = emailOrUsername.Contains("@"), // 只有 email 格式才標記為已確認
                    IsActive = true
                };

                var result = await _userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, roleName);
                    _logger.LogInformation("Created user: {UserName} with role: {Role}", emailOrUsername, roleName);
                }
                else
                {
                    _logger.LogError("Failed to create user {UserName}: {Errors}", 
                        emailOrUsername, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }

        private async Task CreateSampleDataAsync()
        {
            // 只建立帳號，不建立假資料
            // 其他資料讓用戶通過介面建立
            _logger.LogInformation("Database initialized with user accounts only. Other data should be created through the UI.");
        }
    }
}