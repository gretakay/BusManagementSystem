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
    public class PeopleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PeopleController> _logger;

        public PeopleController(ApplicationDbContext context, ILogger<PeopleController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "AdminRead")]
        public async Task<ActionResult<List<PersonListDto>>> GetPeople(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? monastery = null,
            [FromQuery] PersonRole? role = null)
        {
            try
            {
                var query = _context.People.AsQueryable();

                // 搜尋條件
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(p => p.Name.Contains(search) || 
                                           p.StudentId.Contains(search) ||
                                           (p.DharmaName != null && p.DharmaName.Contains(search)));
                }

                if (!string.IsNullOrWhiteSpace(monastery))
                {
                    query = query.Where(p => p.Monastery == monastery);
                }

                if (role.HasValue)
                {
                    query = query.Where(p => p.Role == role.Value);
                }

                var totalCount = await query.CountAsync();

                var people = await query
                    .OrderBy(p => p.Monastery)
                    .ThenBy(p => p.Name)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new PersonListDto
                    {
                        Id = p.Id,
                        StudentId = p.StudentId,
                        Name = p.Name,
                        DharmaName = p.DharmaName,
                        Monastery = p.Monastery,
                        Role = GetRoleDisplayName(p.Role),
                        IsActive = p.IsActive,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                Response.Headers["X-Total-Count"] = totalCount.ToString();
                return Ok(people);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting people list");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "AdminRead")]
        public async Task<ActionResult<PersonDetailDto>> GetPerson(int id)
        {
            try
            {
                var person = await _context.People.FindAsync(id);
                if (person == null)
                {
                    return NotFound();
                }

                var personDto = new PersonDetailDto
                {
                    Id = person.Id,
                    StudentId = person.StudentId,
                    Name = person.Name,
                    DharmaName = person.DharmaName,
                    Monastery = person.Monastery,
                    Role = person.Role,
                    RoleDisplayName = GetRoleDisplayName(person.Role),
                    Remark = person.Remark,
                    IsActive = person.IsActive,
                    CreatedAt = person.CreatedAt,
                    UpdatedAt = person.UpdatedAt
                };

                return Ok(personDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting person {PersonId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "AdminWrite")]
        public async Task<ActionResult<PersonDetailDto>> CreatePerson(CreatePersonRequest request)
        {
            try
            {
                // 檢查學號是否已存在
                if (await _context.People.AnyAsync(p => p.StudentId == request.StudentId))
                {
                    return BadRequest(new { message = "學號已存在" });
                }

                var person = new Person
                {
                    StudentId = request.StudentId,
                    Name = request.Name,
                    DharmaName = request.DharmaName,
                    Monastery = request.Monastery,
                    Role = request.Role,
                    Remark = request.Remark,
                    IsActive = true
                };

                _context.People.Add(person);
                await _context.SaveChangesAsync();

                var personDto = new PersonDetailDto
                {
                    Id = person.Id,
                    StudentId = person.StudentId,
                    Name = person.Name,
                    DharmaName = person.DharmaName,
                    Monastery = person.Monastery,
                    Role = person.Role,
                    RoleDisplayName = GetRoleDisplayName(person.Role),
                    Remark = person.Remark,
                    IsActive = person.IsActive,
                    CreatedAt = person.CreatedAt
                };

                _logger.LogInformation("Person created: {StudentId} - {Name}", request.StudentId, request.Name);
                return CreatedAtAction(nameof(GetPerson), new { id = person.Id }, personDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating person");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminWrite")]
        public async Task<IActionResult> UpdatePerson(int id, UpdatePersonRequest request)
        {
            try
            {
                var person = await _context.People.FindAsync(id);
                if (person == null)
                {
                    return NotFound();
                }

                person.Name = request.Name;
                person.DharmaName = request.DharmaName;
                person.Monastery = request.Monastery;
                person.Role = request.Role;
                person.Remark = request.Remark;
                person.IsActive = request.IsActive;
                person.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Person updated: {StudentId} - {Name}", person.StudentId, person.Name);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating person {PersonId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminWrite")]
        public async Task<IActionResult> DeletePerson(int id)
        {
            try
            {
                var person = await _context.People
                    .Include(p => p.Assignments)
                    .Include(p => p.Boardings)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (person == null)
                {
                    return NotFound();
                }

                // 檢查是否有相關記錄
                if (person.Boardings.Any())
                {
                    return BadRequest(new { message = "無法刪除有上下車記錄的人員" });
                }

                // 軟刪除：設為不活躍
                person.IsActive = false;
                person.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Person deactivated: {StudentId} - {Name}", person.StudentId, person.Name);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting person {PersonId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("roles")]
        public ActionResult<List<PersonRoleInfo>> GetPersonRoles()
        {
            var roles = Enum.GetValues<PersonRole>()
                .Select(role => new PersonRoleInfo
                {
                    Value = role,
                    DisplayName = GetRoleDisplayName(role),
                    Description = GetRoleDescription(role)
                })
                .ToList();

            return Ok(roles);
        }

        [HttpGet("monasteries")]
        [Authorize(Policy = "AdminRead")]
        public async Task<ActionResult<List<string>>> GetMonasteries()
        {
            try
            {
                var monasteries = await _context.People
                    .Where(p => p.IsActive)
                    .Select(p => p.Monastery)
                    .Distinct()
                    .OrderBy(m => m)
                    .ToListAsync();

                return Ok(monasteries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting monasteries");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private string GetRoleDisplayName(PersonRole role)
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

        private string GetRoleDescription(PersonRole role)
        {
            return role switch
            {
                PersonRole.LongTermVolunteer => "長期參與各項活動的義工",
                PersonRole.BuddhistPatrol => "負責佛教巡迴活動的義工",
                PersonRole.Museum => "博物館相關工作人員",
                PersonRole.Monk => "法師",
                PersonRole.MonasteryVolunteer => "精舍的義工人員",
                _ => ""
            };
        }
    }
}