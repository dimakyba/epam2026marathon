using APIHandler.Models.GroupReservation;
using APIHandler.Models.GuestSessions;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace APIHandler.Services.GroupPreOrders;

public interface IGroupPreOrderService
{
    Task<GetAllSessionsResponse> GetGroupSessionsAsync(string userId, string groupReservationId);

    Task<GetOwnerSessionIdResponse> GetOwnerSessionIdAsync(string userId, string reservationId);

    Task<IReadOnlyList<SubmitGroupPreOrderItemResponse>> SubmitGroupPreOrderAsync(
        string userId,
        string groupReservationId,
        string reservationId);
}
