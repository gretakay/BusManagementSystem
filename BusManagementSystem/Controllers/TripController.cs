using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Data;
using BusManagementSystem.DTOs;
using BusManagementSystem.Models;
using System.Globalization;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/trips")]
    [Authorize]
    public class TripController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TripController> _logger;

        public TripController(ApplicationDbContext context, ILogger<TripController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Helper: 檢查行程是否有時間衝突（同車輛/領隊/乘客重疊）
        // 解決：行程重疊風險
        private async Task<bool> HasTripConflict(DateTime date, int? busId = null, int? leaderId = null, int? personId = null, int? excludeTripId = null)
        {
            var query = _context.Trips.AsQueryable();

            // 只檢查同一天的行程（如有多日行程，應改為日期區間）
            query = query.Where(t => t.Date.Date == date.Date);

            if (excludeTripId.HasValue)
                query = query.Where(t => t.Id != excludeTripId.Value);

            if (busId.HasValue)
                query = query.Where(t => t.Buses.Any(b => b.Id == busId.Value));

            if (leaderId.HasValue)
                query = query.Where(t => t.Buses.Any(b => b.LeaderUserId == leaderId.Value));

            if (personId.HasValue)
                query = query.Where(t => t.Assignments.Any(a => a.PersonId == personId.Value));

            return await query.AnyAsync();
        }

        [HttpGet]
        [Authorize(Policy = "AdminRead")]
        public async Task<ActionResult<List<TripDto>>> GetTrips()
        {
            try
            {
                var trips = await _context.Trips
                    .Include(t => t.Buses)
                        .ThenInclude(b => b.LeaderUser)
                    .Include(t => t.Assignments)
                    .Include(t => t.Boardings)
                    .OrderByDescending(t => t.Date)
                    .Select(t => new TripDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        Date = t.Date,
                        Direction = t.Direction,
                        Status = t.Status,
                        Description = t.Description,
                        Buses = t.Buses.Select(b => new BusDto
                        {
                            Id = b.Id,
                            Name = b.Name,
                            Capacity = b.Capacity,
                            LeaderUserId = b.LeaderUserId,
                            LeaderName = b.LeaderUser.DisplayName,
                            Description = b.Description,
                            AssignedCount = b.Assignments.Count,
                            OnBoardCount = b.Boardings
                                .GroupBy(boarding => boarding.PersonId)
                                .Count(group => group.OrderByDescending(boarding => boarding.Timestamp)
                                    .First().Action == BoardingAction.Board)
                        }).ToList(),
                        TotalCapacity = t.Buses.Sum(b => b.Capacity),
                        TotalAssigned = t.Assignments.Count,
                        TotalOnBoard = t.Boardings
                            .GroupBy(boarding => boarding.PersonId)
                            .Count(group => group.OrderByDescending(boarding => boarding.Timestamp)
                                .First().Action == BoardingAction.Board)
                    })
                    .ToListAsync();

                return Ok(trips);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trips");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "AdminRead")]
        public async Task<ActionResult<TripDto>> GetTrip(int id)
        {
            try
            {
                var trip = await _context.Trips
                    .Include(t => t.Buses)
                        .ThenInclude(b => b.LeaderUser)
                    .Include(t => t.Assignments)
                    .Include(t => t.Boardings)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (trip == null)
                {
                    return NotFound();
                }

                var tripDto = new TripDto
                {
                    Id = trip.Id,
                    Name = trip.Name,
                    Date = trip.Date,
                    Direction = trip.Direction,
                    Status = trip.Status,
                    Description = trip.Description,
                    Buses = trip.Buses.Select(b => new BusDto
                    {
                        Id = b.Id,
                        Name = b.Name,
                        Capacity = b.Capacity,
                        LeaderUserId = b.LeaderUserId,
                        LeaderName = b.LeaderUser.DisplayName,
                        Description = b.Description,
                        AssignedCount = b.Assignments.Count,
                        OnBoardCount = b.Boardings
                            .GroupBy(boarding => boarding.PersonId)
                            .Count(group => group.OrderByDescending(boarding => boarding.Timestamp)
                                .First().Action == BoardingAction.Board)
                    }).ToList(),
                    TotalCapacity = trip.Buses.Sum(b => b.Capacity),
                    TotalAssigned = trip.Assignments.Count,
                    TotalOnBoard = trip.Boardings
                        .GroupBy(boarding => boarding.PersonId)
                        .Count(group => group.OrderByDescending(boarding => boarding.Timestamp)
                            .First().Action == BoardingAction.Board)
                };

                return Ok(tripDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trip {TripId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "AdminWrite")]
        public async Task<ActionResult<TripDto>> CreateTrip(CreateTripRequest request)
        {
            try
            {
                // 新增：時區統一處理，所有時間皆用 UTC
                var tripDate = request.Date.Kind == DateTimeKind.Utc ? request.Date : request.Date.ToUniversalTime();

                // 新增：行程衝突檢查（同一天同車輛/領隊/乘客不可重複）
                if (await HasTripConflict(tripDate))
                {
                    return BadRequest(new { message = "Trip conflict detected: same date and resource already scheduled." });
                }

                var trip = new Trip
                {
                    Name = request.Name,
                    Date = tripDate,
                    Direction = request.Direction,
                    Description = request.Description,
                    Status = TripStatus.Draft
                };

                _context.Trips.Add(trip);
                await _context.SaveChangesAsync();

                var tripDto = new TripDto
                {
                    Id = trip.Id,
                    Name = trip.Name,
                    Date = trip.Date,
                    Direction = trip.Direction,
                    Status = trip.Status,
                    Description = trip.Description,
                    Buses = new List<BusDto>(),
                    TotalCapacity = 0,
                    TotalAssigned = 0,
                    TotalOnBoard = 0
                };

                _logger.LogInformation("Trip {TripName} created with ID {TripId}", request.Name, trip.Id);
                return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, tripDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating trip");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminWrite")]
        public async Task<IActionResult> UpdateTrip(int id, UpdateTripRequest request)
        {
            try
            {
                var trip = await _context.Trips.FindAsync(id);
                if (trip == null)
                {
                    return NotFound();
                }

                // 新增：時區統一處理
                var tripDate = request.Date.Kind == DateTimeKind.Utc ? request.Date : request.Date.ToUniversalTime();

                // 新增：行程衝突檢查（排除自己）
                if (await HasTripConflict(tripDate, excludeTripId: id))
                {
                    return BadRequest(new { message = "Trip conflict detected: same date and resource already scheduled." });
                }

                trip.Name = request.Name;
                trip.Date = tripDate;
                trip.Status = request.Status;
                trip.Description = request.Description;
                trip.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Trip {TripId} updated", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating trip {TripId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminWrite")]
        public async Task<IActionResult> DeleteTrip(int id)
        {
            try
            {
                var trip = await _context.Trips
                    .Include(t => t.Buses)
                    .Include(t => t.Assignments)
                    .Include(t => t.Boardings)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (trip == null)
                {
                    return NotFound();
                }

                // 檢查是否有相關記錄
                if (trip.Boardings.Any())
                {
                    return BadRequest(new { message = "Cannot delete trip with boarding records" });
                }

                // 新增：同步清理分配資料，避免殘留孤兒資料
                _context.Assignments.RemoveRange(trip.Assignments);

                _context.Trips.Remove(trip);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Trip {TripId} deleted", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting trip {TripId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("{id}/open")]
        [Authorize(Policy = "AdminWrite")]
        public async Task<IActionResult> OpenTrip(int id)
        {
            try
            {
                var trip = await _context.Trips.FindAsync(id);
                if (trip == null)
                {
                    return NotFound();
                }

                // 新增：狀態流轉前檢查資料完整性（如必須有車輛/領隊/站點）
                var hasBus = await _context.Buses.AnyAsync(b => b.TripId == id);
                if (!hasBus)
                {
                    return BadRequest(new { message = "Cannot open trip without assigned bus." });
                }

                trip.Status = TripStatus.Open;
                trip.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Trip {TripId} opened", id);
                return Ok(new { message = "Trip opened successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error opening trip {TripId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("{id}/close")]
        [Authorize(Policy = "AdminWrite")]
        public async Task<IActionResult> CloseTrip(int id)
        {
            try
            {
                var trip = await _context.Trips.FindAsync(id);
                if (trip == null)
                {
                    return NotFound();
                }

                trip.Status = TripStatus.Closed;
                trip.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Trip {TripId} closed", id);
                return Ok(new { message = "Trip closed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error closing trip {TripId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}