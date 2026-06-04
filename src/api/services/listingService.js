// src/api/services/listingService.js
/**
 * Marketplace / Listing endpoints
 *
 * GET    /api/listings          – all active listings in society (paginated, filterable)
 * POST   /api/listings          – create a new listing (resident/admin)
 * GET    /api/listings/my       – listings posted by current user
 * GET    /api/listings/:id      – single listing detail
 * PATCH  /api/listings/:id      – update own listing
 * DELETE /api/listings/:id      – delete own listing
 * POST   /api/listings/:id/interest – toggle interest (resident)
 */
import api from '../interceptors';

export const listingService = {
  /** Fetch all active listings in the society */
  getListings: (params) =>
    api.get('/listings', { params }).then((r) => r.data),

  /** Listings posted by the logged-in user */
  getMyListings: () =>
    api.get('/listings/my').then((r) => r.data),

  /** Single listing by ID */
  getListingById: (id) =>
    api.get(`/listings/${id}`).then((r) => r.data),

  /** Create a new listing */
  createListing: (payload) =>
    api.post('/listings', payload).then((r) => r.data),

  /** Update own listing (partial) */
  updateListing: (id, payload) =>
    api.patch(`/listings/${id}`, payload).then((r) => r.data),

  /** Delete own listing */
  deleteListing: (id) =>
    api.delete(`/listings/${id}`).then((r) => r.data),

  /** Toggle interest (resident) */
  toggleInterest: (id) =>
    api.post(`/listings/${id}/interest`).then((r) => r.data),
};