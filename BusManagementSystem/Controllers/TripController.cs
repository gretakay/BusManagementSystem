using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Data;
using BusManagementSystem.DTOs;
using BusManagementSystem.Models;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
                var trip = new Trip
                {
                    Name = request.Name,
                    Date = request.Date,
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

                trip.Name = request.Name;
                trip.Date = request.Date;
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