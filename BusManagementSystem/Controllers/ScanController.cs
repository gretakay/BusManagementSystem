using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Data;
using BusManagementSystem.DTOs;
using BusManagementSystem.Models;
using System.Security.Claims;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Leader")]
    public class ScanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ScanController> _logger;

        public ScanController(ApplicationDbContext context, ILogger<ScanController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<ScanResponse>> Scan(ScanRequest request)
        {
            try
            {
                // 驗證領隊權限：只能操作自己負責的車
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var bus = await _context.Buses
                    .Include(b => b.Trip)
                    .FirstOrDefaultAsync(b => b.Id == request.BusId && b.LeaderUserId == currentUserId);

                if (bus == null)
                {
                    return Forbid("You are not authorized to operate this bus");
                }

                // 檢查行程狀態
                if (bus.Trip.Status != TripStatus.Open)
                {
                    return BadRequest(new ScanResponse
                    {
                        Success = false,
                        Message = "Trip is not open for boarding"
                    });
                }

                // 查找人員
                var person = await _context.People
                    .FirstOrDefaultAsync(p => p.StudentId == request.CardNoOrToken && p.IsActive);

                if (person == null)
                {
                    return BadRequest(new ScanResponse
                    {
                        Success = false,
                        Message = "Person not found or inactive"
                    });
                }

                // 確保此人已被分配到這台車
                var assignment = await _context.Assignments
                    .FirstOrDefaultAsync(a => a.TripId == request.TripId && a.PersonId == person.Id);

                if (assignment == null)
                {
                    // 自動分配到當前車（先到先上車邏輯）
                    assignment = new Assignment
                    {
                        TripId = request.TripId,
                        PersonId = person.Id,
                        BusId = request.BusId,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.Assignments.Add(assignment);
                }
                else if (assignment.BusId != request.BusId)
                {
                    return BadRequest(new ScanResponse
                    {
                        Success = false,
                        Message = $"Person is assigned to different bus: {assignment.Bus?.Name}"
                    });
                }

                // 決定上車或下車動作
                var lastBoarding = await _context.Boardings
                    .Where(b => b.TripId == request.TripId && b.PersonId == person.Id)
                    .OrderByDescending(b => b.Timestamp)
                    .FirstOrDefaultAsync();

                var action = request.Action ?? DetermineAction(lastBoarding);

                // 檢查車輛容量
                if (action == BoardingAction.Board)
                {
                    var currentOnBoard = await GetCurrentOnBoardCount(request.BusId, request.TripId);
                    if (currentOnBoard >= bus.Capacity)
                    {
                        return BadRequest(new ScanResponse
                        {
                            Success = false,
                            Message = "Bus is at full capacity"
                        });
                    }
                }

                // 記錄上下車
                var boarding = new Boarding
                {
                    TripId = request.TripId,
                    BusId = request.BusId,
                    PersonId = person.Id,
                    Action = action,
                    Timestamp = DateTime.UtcNow,
                    DeviceId = request.DeviceId,
                    Source = BoardingSource.Online,
                    UniqueHash = GenerateUniqueHash(request.TripId, request.BusId, person.Id, DateTime.UtcNow),
                    Notes = request.Notes
                };

                _context.Boardings.Add(boarding);
                await _context.SaveChangesAsync();

                // 獲取更新後的車輛狀態
                var busStatus = await GetBusStatus(request.BusId, request.TripId);

                var response = new ScanResponse
                {
                    Success = true,
                    Message = action == BoardingAction.Board ? "Boarded successfully" : "Unboarded successfully",
                    Action = action,
                    Person = new PersonDto
                    {
                        Id = person.Id,
                        StudentId = person.StudentId,
                        Name = person.Name,
                        DharmaName = person.DharmaName,
                        Monastery = person.Monastery,
                        Role = GetPersonRoleDisplayName(person.Role),
                        IsOnBoard = action == BoardingAction.Board
                    },
                    BusStatus = busStatus
                };

                _logger.LogInformation("Person {PersonName} ({CardNo}) {Action} bus {BusName}", 
                    person.Name, person.CardNo, action, bus.Name);

                // TODO: 發送 SignalR 通知
                // await _hubContext.Clients.Group($"Bus_{request.BusId}").SendAsync("BoardingUpdate", response);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during scan operation");
                return StatusCode(500, new ScanResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        [HttpGet("bus/{busId}/status")]
        public async Task<ActionResult<BusStatusDto>> GetBusStatus(int busId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var bus = await _context.Buses
                    .FirstOrDefaultAsync(b => b.Id == busId && b.LeaderUserId == currentUserId);

                if (bus == null)
                {
                    return Forbid("You are not authorized to view this bus");
                }

                var busStatus = await GetBusStatus(busId, bus.TripId);
                return Ok(busStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bus status");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private BoardingAction DetermineAction(Boarding? lastBoarding)
        {
            if (lastBoarding == null || lastBoarding.Action == BoardingAction.Unboard)
            {
                return BoardingAction.Board;
            }
            return BoardingAction.Unboard;
        }

        private async Task<int> GetCurrentOnBoardCount(int busId, int tripId)
        {
            var boardings = await _context.Boardings
                .Where(b => b.BusId == busId && b.TripId == tripId)
                .GroupBy(b => b.PersonId)
                .Select(g => new
                {
                    PersonId = g.Key,
                    LastAction = g.OrderByDescending(b => b.Timestamp).First().Action
                })
                .ToListAsync();

            return boardings.Count(b => b.LastAction == BoardingAction.Board);
        }

        private async Task<BusStatusDto> GetBusStatus(int busId, int tripId)
        {
            var bus = await _context.Buses.FindAsync(busId);
            var onBoardPersons = await _context.Boardings
                .Where(b => b.BusId == busId && b.TripId == tripId)
                .Include(b => b.Person)
                .GroupBy(b => b.PersonId)
                .Where(g => g.OrderByDescending(b => b.Timestamp).First().Action == BoardingAction.Board)
                .Select(g => new PersonDto
                {
                    Id = g.First().Person.Id,
                    StudentId = g.First().Person.StudentId,
                    Name = g.First().Person.Name,
                    DharmaName = g.First().Person.DharmaName,
                    Monastery = g.First().Person.Monastery,
                    Role = GetPersonRoleDisplayName(g.First().Person.Role),
                    IsOnBoard = true
                })
                .ToListAsync();

            return new BusStatusDto
            {
                BusId = busId,
                BusName = bus?.Name ?? "Unknown",
                CurrentCount = onBoardPersons.Count,
                Capacity = bus?.Capacity ?? 0,
                OnBoardPersons = onBoardPersons
            };
        }

        private string GenerateUniqueHash(int tripId, int busId, int personId, DateTime timestamp)
        {
            var input = $"{tripId}_{busId}_{personId}_{timestamp:yyyyMMddHHmmssfff}";
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(input));
        }

        private string GetPersonRoleDisplayName(PersonRole role)
        {
            return role switch
            {
                PersonRole.LongTermVolunteer => "長期義工",
                PersonRole.BuddhistPatrol => "佛巡",
                PersonRole.Museum => "博物館",
                PersonRole.Monk => "法師",
                PersonRole.MonasteryVolunteer => "精舍義工",
                _ => role.ToString()
            };
        }
    }
}