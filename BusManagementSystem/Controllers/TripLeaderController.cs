using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusManagementSystem.Data;
using BusManagementSystem.Models;
using BusManagementSystem.DTOs;

namespace BusManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "AdminWrite,SysAdmin")]
    public class TripLeaderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TripLeaderController> _logger;

        public TripLeaderController(ApplicationDbContext context, ILogger<TripLeaderController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 取得所有行程領隊指派
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TripLeaderResponse>>> GetTripLeaders()
        {
            var tripLeaders = await _context.TripLeaders
                .Include(tl => tl.Trip)
                .Include(tl => tl.Person)
                .Where(tl => tl.IsActive)
                .OrderBy(tl => tl.Trip.Date)
                .Select(tl => new TripLeaderResponse
                {
                    Id = tl.Id,
                    TripId = tl.TripId,
                    TripName = tl.Trip.Name,
                    TripDate = tl.Trip.Date,
                    LeaderPersonId = tl.PersonId,
                    LeaderDisplayName = tl.Person.Name,
                    LeaderStudentId = tl.LeaderStudentId,
                    Description = tl.Description,
                    CanLoginFrom = tl.Trip.Date.AddDays(-3),
                    CanLoginTo = tl.Trip.Date.AddDays(1)
                })
                .ToListAsync();

            return Ok(tripLeaders);
        }

        /// <summary>
        /// 為行程指派領隊
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TripLeaderResponse>> AssignLeaderToTrip(AssignTripLeaderRequest request)
        {
            // 檢查行程是否存在
            var trip = await _context.Trips.FindAsync(request.TripId);
            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            // 檢查學員是否存在
            var person = await _context.People.FirstOrDefaultAsync(p => p.StudentId == request.LeaderStudentId && p.IsActive);
            if (person == null)
            {
                return NotFound(new { message = "Person not found with the provided student ID" });
            }

            // 檢查是否已經指派過
            var existingAssignment = await _context.TripLeaders
                .FirstOrDefaultAsync(tl => tl.TripId == request.TripId && 
                                           tl.PersonId == person.Id && 
                                           tl.IsActive);
            
            if (existingAssignment != null)
            {
                return Conflict(new { message = "Person is already assigned as leader for this trip" });
            }

            var tripLeader = new TripLeader
            {
                TripId = request.TripId,
                PersonId = person.Id,
                LeaderStudentId = request.LeaderStudentId,
                Description = request.Description
            };

            _context.TripLeaders.Add(tripLeader);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Assigned person {StudentId} as leader to trip {TripId}", 
                request.LeaderStudentId, request.TripId);

            // 返回詳細資訊
            var result = await _context.TripLeaders
                .Include(tl => tl.Trip)
                .Include(tl => tl.Person)
                .Where(tl => tl.Id == tripLeader.Id)
                .Select(tl => new TripLeaderResponse
                {
                    Id = tl.Id,
                    TripId = tl.TripId,
                    TripName = tl.Trip.Name,
                    TripDate = tl.Trip.Date,
                    LeaderPersonId = tl.PersonId,
                    LeaderDisplayName = tl.Person.Name,
                    LeaderStudentId = tl.LeaderStudentId,
                    Description = tl.Description,
                    CanLoginFrom = tl.Trip.Date.AddDays(-3),
                    CanLoginTo = tl.Trip.Date.AddDays(1)
                })
                .FirstAsync();

            return CreatedAtAction(nameof(GetTripLeaders), new { id = tripLeader.Id }, result);
        }

        /// <summary>
        /// 移除行程領隊指派
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveTripLeader(int id)
        {
            var tripLeader = await _context.TripLeaders.FindAsync(id);
            if (tripLeader == null)
            {
                return NotFound();
            }

            tripLeader.IsActive = false;
            tripLeader.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed trip leader assignment {Id}", id);

            return NoContent();
        }

        /// <summary>
        /// 取得特定領隊的行程列表
        /// </summary>
        [HttpGet("by-leader/{studentId}")]
        [AllowAnonymous] // 允許領隊查詢自己的行程
        public async Task<ActionResult<IEnumerable<TripLeaderResponse>>> GetTripsByLeader(string studentId)
        {
            var trips = await _context.TripLeaders
                .Include(tl => tl.Trip)
                .Include(tl => tl.Person)
                .Where(tl => tl.LeaderStudentId == studentId && tl.IsActive)
                .OrderBy(tl => tl.Trip.Date)
                .Select(tl => new TripLeaderResponse
                {
                    Id = tl.Id,
                    TripId = tl.TripId,
                    TripName = tl.Trip.Name,
                    TripDate = tl.Trip.Date,
                    LeaderPersonId = tl.PersonId,
                    LeaderDisplayName = tl.Person.Name,
                    LeaderStudentId = tl.LeaderStudentId,
                    Description = tl.Description,
                    CanLoginFrom = tl.Trip.Date.AddDays(-3),
                    CanLoginTo = tl.Trip.Date.AddDays(1)
                })
                .ToListAsync();

            return Ok(trips);
        }
    }
}