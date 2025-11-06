using System.ComponentModel.DataAnnotations;

namespace BusManagementSystem.DTOs
{
    public class LoginRequest
    {
        [Required]
        public string UserIdentifier { get; set; } = string.Empty; // 可以是 email, username 或學號

        public string? Password { get; set; } // 密碼變成可選，領隊用學號登入時不需要
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserInfo User { get; set; } = new();
    }

    public class UserInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
    }

    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}