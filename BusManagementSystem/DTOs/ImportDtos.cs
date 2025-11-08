using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.DTOs
{
    public class ImportPreviewItem
    {
        public string StudentId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Monastery { get; set; } = string.Empty;
        public string DharmaName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime? RegisteredDate { get; set; }
        public string Note { get; set; } = string.Empty;
        public bool ExistsAsPerson { get; set; }
        public bool HasAssignmentConflict { get; set; }
    }

    public class ImportResultDto
    {
        public int ImportRecordId { get; set; }
        public int CreatedAssignments { get; set; }
        public int UpdatedPersons { get; set; }
        public int Skipped { get; set; }
    }

    public class RollbackRequest
    {
        [Required]
        public int ImportRecordId { get; set; }
    }
}
