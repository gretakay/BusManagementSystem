using BusManagementSystem.Data;
using BusManagementSystem.DTOs;
using BusManagementSystem.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BusManagementSystem.Services
{
    public class ImportService
    {
        private readonly ApplicationDbContext _context;

        public ImportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<ImportPreviewItem>> ParseCsvPreviewAsync(Stream csvStream)
        {
            var list = new List<ImportPreviewItem>();
            using var reader = new StreamReader(csvStream);
            var header = await reader.ReadLineAsync();
            if (header == null) return list;

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;
                var cols = line.Split(',');
                // Expect: StudentId,Monastery,Name,DharmaName,Role,RegisteredDate
                var item = new ImportPreviewItem
                {
                    StudentId = cols.ElementAtOrDefault(0)?.Trim() ?? string.Empty,
                    Monastery = cols.ElementAtOrDefault(1)?.Trim() ?? string.Empty,
                    Name = cols.ElementAtOrDefault(2)?.Trim() ?? string.Empty,
                    DharmaName = cols.ElementAtOrDefault(3)?.Trim() ?? string.Empty,
                    Role = cols.ElementAtOrDefault(4)?.Trim() ?? string.Empty,
                };

                var dateStr = cols.ElementAtOrDefault(5)?.Trim();
                if (DateTime.TryParse(dateStr, out var dt)) item.RegisteredDate = dt;

                // Detect if person exists
                var exists = await _context.People.AnyAsync(p => p.StudentId == item.StudentId && p.IsActive);
                item.ExistsAsPerson = exists;

                // Detect existing assignment for the trip date if possible
                if (item.RegisteredDate.HasValue)
                {
                    var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Date.Date == item.RegisteredDate.Value.Date);
                    if (trip != null && exists)
                    {
                        var person = await _context.People.FirstOrDefaultAsync(p => p.StudentId == item.StudentId && p.IsActive);
                        if (person != null)
                        {
                            var assignment = await _context.Assignments.FirstOrDefaultAsync(a => a.TripId == trip.Id && a.PersonId == person.Id);
                            item.HasAssignmentConflict = assignment != null;
                        }
                    }
                }

                list.Add(item);
            }

            return list;
        }

        public async Task<ImportResultDto> ExecuteImportAsync(Stream csvStream, string importerUserId, bool forceReassign = false)
        {
            using var reader = new StreamReader(csvStream);
            var header = await reader.ReadLineAsync();
            if (header == null) return new ImportResultDto();

            var createdAssignmentIds = new List<int>();
            int createdAssignments = 0, updatedPersons = 0, skipped = 0;

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;
                var cols = line.Split(',');
                var studentId = cols.ElementAtOrDefault(0)?.Trim() ?? string.Empty;
                var monastery = cols.ElementAtOrDefault(1)?.Trim() ?? string.Empty;
                var name = cols.ElementAtOrDefault(2)?.Trim() ?? string.Empty;
                var dharmaName = cols.ElementAtOrDefault(3)?.Trim() ?? string.Empty;
                var roleStr = cols.ElementAtOrDefault(4)?.Trim() ?? string.Empty;
                DateTime? regDate = null;
                var dateStr = cols.ElementAtOrDefault(5)?.Trim();
                if (DateTime.TryParse(dateStr, out var dt)) regDate = dt;

                // find or create person
                var person = await _context.People.FirstOrDefaultAsync(p => p.StudentId == studentId && p.IsActive);
                if (person == null)
                {
                    person = new Person
                    {
                        StudentId = studentId,
                        Name = name,
                        DharmaName = dharmaName,
                        Monastery = monastery,
                        Role = Enum.TryParse<PersonRole>(roleStr, out var r) ? r : PersonRole.MonasteryVolunteer,
                        IsActive = true
                    };
                    _context.People.Add(person);
                    await _context.SaveChangesAsync();
                    updatedPersons++;
                }
                else
                {
                    // update basic info
                    person.Name = name;
                    person.DharmaName = dharmaName;
                    person.Monastery = monastery;
                    if (Enum.TryParse<PersonRole>(roleStr, out var r2)) person.Role = r2;
                    person.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    updatedPersons++;
                }

                if (!regDate.HasValue) { skipped++; continue; }

                var trip = await _context.Trips.FirstOrDefaultAsync(t => t.Date.Date == regDate.Value.Date);
                if (trip == null) { skipped++; continue; }

                var existingAssignment = await _context.Assignments.FirstOrDefaultAsync(a => a.TripId == trip.Id && a.PersonId == person.Id);
                if (existingAssignment != null && !forceReassign)
                {
                    skipped++; continue;
                }

                if (existingAssignment != null && forceReassign)
                {
                    existingAssignment.BusId = existingAssignment.BusId; // keep same bus unless otherwise specified
                    existingAssignment.AssignedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    // nothing to add to createdAssignmentIds
                }
                else
                {
                    // auto assign to first available bus (simple strategy)
                    var bus = await _context.Buses.FirstOrDefaultAsync(b => b.TripId == trip.Id);
                    if (bus == null)
                    {
                        // no available bus to assign => skip
                        skipped++;
                        continue;
                    }
                    var assignment = new Assignment
                    {
                        TripId = trip.Id,
                        PersonId = person.Id,
                        BusId = bus.Id,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.Assignments.Add(assignment);
                    await _context.SaveChangesAsync();
                    createdAssignments++;
                    createdAssignmentIds.Add(assignment.Id);
                }
            }

            // create import record
            var importRecord = new ImportRecord
            {
                ImporterUserId = importerUserId,
                CreatedAt = DateTime.UtcNow,
                Summary = JsonSerializer.Serialize(new { createdAssignments, updatedPersons, skipped }),
                CreatedAssignmentIdsJson = JsonSerializer.Serialize(createdAssignmentIds)
            };
            _context.ImportRecords.Add(importRecord);
            await _context.SaveChangesAsync();

            return new ImportResultDto
            {
                ImportRecordId = importRecord.Id,
                CreatedAssignments = createdAssignments,
                UpdatedPersons = updatedPersons,
                Skipped = skipped
            };
        }

        public async Task<bool> RollbackImportAsync(int importRecordId)
        {
            var record = await _context.ImportRecords.FindAsync(importRecordId);
            if (record == null || record.IsRolledBack) return false;

            try
            {
                var ids = JsonSerializer.Deserialize<List<int>>(record.CreatedAssignmentIdsJson) ?? new List<int>();
                foreach (var id in ids)
                {
                    var a = await _context.Assignments.FindAsync(id);
                    if (a != null)
                    {
                        // soft delete assignment by removing it
                        _context.Assignments.Remove(a);
                    }
                }

                record.IsRolledBack = true;
                record.RolledBackAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
