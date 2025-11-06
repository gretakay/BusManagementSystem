using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using BusManagementSystem.DTOs;

namespace BusManagementSystem.Hubs
{
    [Authorize]
    public class BoardingHub : Hub
    {
        private readonly ILogger<BoardingHub> _logger;

        public BoardingHub(ILogger<BoardingHub> logger)
        {
            _logger = logger;
        }

        public async Task JoinBusGroup(int busId)
        {
            var groupName = $"Bus_{busId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("User {UserId} joined bus group {GroupName}", Context.UserIdentifier, groupName);
        }

        public async Task LeaveBusGroup(int busId)
        {
            var groupName = $"Bus_{busId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("User {UserId} left bus group {GroupName}", Context.UserIdentifier, groupName);
        }

        public async Task JoinTripGroup(int tripId)
        {
            var groupName = $"Trip_{tripId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("User {UserId} joined trip group {GroupName}", Context.UserIdentifier, groupName);
        }

        public async Task LeaveTripGroup(int tripId)
        {
            var groupName = $"Trip_{tripId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("User {UserId} left trip group {GroupName}", Context.UserIdentifier, groupName);
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("User {UserId} connected to BoardingHub", Context.UserIdentifier);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("User {UserId} disconnected from BoardingHub", Context.UserIdentifier);
            await base.OnDisconnectedAsync(exception);
        }

        // 發送上下車更新通知
        public async Task SendBoardingUpdate(int busId, ScanResponse scanResponse)
        {
            var groupName = $"Bus_{busId}";
            await Clients.Group(groupName).SendAsync("BoardingUpdate", scanResponse);
        }

        // 發送車輛狀態更新
        public async Task SendBusStatusUpdate(int busId, BusStatusDto busStatus)
        {
            var groupName = $"Bus_{busId}";
            await Clients.Group(groupName).SendAsync("BusStatusUpdate", busStatus);
        }

        // 發送行程狀態更新
        public async Task SendTripStatusUpdate(int tripId, object tripUpdate)
        {
            var groupName = $"Trip_{tripId}";
            await Clients.Group(groupName).SendAsync("TripStatusUpdate", tripUpdate);
        }
    }
}