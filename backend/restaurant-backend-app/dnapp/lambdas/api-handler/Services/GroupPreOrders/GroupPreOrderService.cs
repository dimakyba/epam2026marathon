using APIHandler.Constants.Orders;
using APIHandler.Entities;
using APIHandler.Exceptions;
using APIHandler.Mappers;
using APIHandler.Models.GroupReservation;
using APIHandler.Models.GuestSessions;
using APIHandler.Models.Orders;
using APIHandler.Repositories.Dishes;
using APIHandler.Repositories.GroupReservations;
using APIHandler.Repositories.GuestSessions;
using APIHandler.Repositories.Orders;
using APIHandler.Repositories.Reservations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace APIHandler.Services.GroupPreOrders;

public class GroupPreOrderService(
    IGroupReservationRepository groupReservationRepository,
    IGuestSessionRepository guestSessionRepository,
    IReservationRepository reservationRepository,
    IDishRepository dishRepository,
    IOrderRepository orderRepository) : IGroupPreOrderService
{
    public async Task<GetAllSessionsResponse> GetGroupSessionsAsync(string userId, string groupReservationId)
    {
        _ = await LoadGroupAndAuthorizeOwnerAsync(userId, groupReservationId);

        List<GuestSession> sessions = await guestSessionRepository.GetAllByGroupReservationIdAsync(groupReservationId);

        return await BuildGuestSnapshotAsync(sessions);
    }

    public async Task<GetOwnerSessionIdResponse> GetOwnerSessionIdAsync(string userId, string reservationId)
    {
        Reservation reservation = await reservationRepository.GetReservationByIdAsync(reservationId)
            ?? throw new ReservationNotFoundException($"Reservation '{reservationId}' was not found.");

        EnsureOwner(reservation, userId);

        GroupReservation group = await groupReservationRepository.GetByReservationIdAsync(reservationId)
            ?? throw new GroupReservationNotFoundException();

        List<GuestSession> sessions = await guestSessionRepository.GetAllByGroupReservationIdAsync(group.GroupReservationId);

        GuestSession? ownerSession = sessions.FirstOrDefault(session =>
            session.IsOwnerSession &&
            string.Equals(session.OwnerUserId, userId, StringComparison.Ordinal));

        if (ownerSession is null)
        {
            ownerSession = new GuestSession
            {
                Id = Guid.NewGuid().ToString(),
                GroupReservationId = group.GroupReservationId,
                GuestName = "Owner",
                Dishes = [],
                IsOwnerSession = true,
                OwnerUserId = userId,
            };

            await guestSessionRepository.SaveAsync(ownerSession);
        }

        return new GetOwnerSessionIdResponse(ownerSession.Id);
    }

    public async Task<IReadOnlyList<SubmitGroupPreOrderItemResponse>> SubmitGroupPreOrderAsync(
        string userId,
        string groupReservationId,
        string reservationId)
    {
        (GroupReservation group, Reservation reservation) = await LoadGroupAndAuthorizeOwnerAsync(userId, groupReservationId);

        if (!string.Equals(group.ReservationId, reservationId, StringComparison.Ordinal))
        {
            throw new ValidationException("The reservation does not belong to the specified group reservation.");
        }

        List<GuestSession> sessions = await guestSessionRepository.GetAllByGroupReservationIdAsync(groupReservationId);
        List<GuestSession> submittedSessions = sessions.Where(session => session.IsSubmitted).ToList();

        if (submittedSessions.Count == 0)
        {
            throw new ValidationException("There are no submitted guest sessions to consolidate.");
        }

        List<ConsolidatedDish> consolidatedDishes = submittedSessions
            .SelectMany(session => session.Dishes ?? [])
            .GroupBy(dish => dish.DishId)
            .Select(groupByDish => new ConsolidatedDish(groupByDish.Key, groupByDish.Sum(dish => dish.Quantity)))
            .Where(dish => dish.Quantity > 0)
            .ToList();

        if (consolidatedDishes.Count == 0)
        {
            throw new ValidationException("The submitted guest sessions do not contain any dishes.");
        }

        Order order = await orderRepository.GetOrderByReservationIdAsync(reservation.Id)
            ?? throw new ValidationException($"Order for reservation '{reservation.Id}' was not found.");

        order.Dishes = consolidatedDishes.Select(dish => new OrderItem
        {
            DishId = dish.DishId,
            Quantity = dish.Quantity,
            State = OrderItemState.Pending,
        }).ToList();
        order.Status = OrderStatus.SubmittedByCustomer;

        await orderRepository.SaveOrderAsync(order);

        group.Status = GroupReservationStatus.Submitted;
        await groupReservationRepository.SaveGroupReservationAsync(group);

        return consolidatedDishes
            .Select(dish => new SubmitGroupPreOrderItemResponse(dish.DishId, dish.Quantity))
            .ToList();
    }

    private async Task<GetAllSessionsResponse> BuildGuestSnapshotAsync(IEnumerable<GuestSession> sessions)
    {
        List<GuestSession> guestSessions = sessions.Where(session => !session.IsOwnerSession).ToList();

        string[] dishIds = guestSessions
            .SelectMany(session => session.Dishes ?? [])
            .Select(dish => dish.DishId)
            .Distinct()
            .ToArray();

        IEnumerable<Dish> dishes = await dishRepository.GetDishesByIdsAsync(dishIds);
        Dictionary<string, Dish> dishesById = dishes.ToDictionary(dish => dish.Id);

        var participants = new List<Participant>(guestSessions.Count);

        foreach (GuestSession session in guestSessions)
        {
            OrderItemResponse[] items = (session.Dishes ?? [])
                .Where(dish => dishesById.ContainsKey(dish.DishId))
                .Select(dish => new OrderItemResponse
                {
                    Dish = DishMapper.ToDishResponse(dishesById[dish.DishId]),
                    Quantity = dish.Quantity,
                })
                .ToArray();

            decimal total = items.Sum(item => item.Quantity * item.Dish.Price);
            participants.Add(new Participant(
                session.Id,
                ParticipantType.Guest,
                session.GuestName,
                items,
                total,
                session.IsSubmitted));
        }

        return new GetAllSessionsResponse(participants, participants.Sum(participant => participant.Total));
    }

    private async Task<(GroupReservation Group, Reservation Reservation)> LoadGroupAndAuthorizeOwnerAsync(
        string userId,
        string groupReservationId)
    {
        GroupReservation group = await groupReservationRepository.GetGroupReservationByIdAsync(groupReservationId)
            ?? throw new GroupReservationNotFoundException();

        Reservation reservation = await reservationRepository.GetReservationByIdAsync(group.ReservationId)
            ?? throw new ReservationNotFoundException($"Reservation '{group.ReservationId}' was not found.");

        EnsureOwner(reservation, userId);

        return (group, reservation);
    }

    private static void EnsureOwner(Reservation reservation, string userId)
    {
        if (string.IsNullOrWhiteSpace(reservation.CustomerId) ||
            !string.Equals(reservation.CustomerId, userId, StringComparison.Ordinal))
        {
            throw new ActionForbiddenException("Only the reservation owner can perform this action.");
        }
    }

    private sealed record ConsolidatedDish(string DishId, int Quantity);
}
