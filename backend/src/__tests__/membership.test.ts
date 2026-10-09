/**
 * Changing membership plan. Stripe is not configured in the test run, so a
 * valid request ends at the honest 503 rather than a checkout page.
 */
import { api, auth, makeArtist, prismaAdmin, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

describe('membership plans', () => {
  it('refuses to sell the plan the artist already holds, and lets them move to the other', async () => {
    const artist = await makeArtist();
    await prismaAdmin.membership.create({
      data: { artistId: artist.artistId, tier: 'ARTIST', priceCents: 5000, status: 'ACTIVE', startsAt: new Date(), endsAt: new Date(Date.now() + 300 * 86400000) },
    });

    const same = await api().post('/api/payments/membership').set(auth(artist.token)).send({ artistId: artist.artistId, membershipType: 'ARTIST' });
    expect(same.status).toBe(409);
    expect(same.body.error.code).toBe('ALREADY_ON_PLAN');

    const upgrade = await api().post('/api/payments/membership').set(auth(artist.token)).send({ artistId: artist.artistId, membershipType: 'PROFESSIONAL' });
    expect(upgrade.status).toBe(503); // reaches the payment step; no Stripe here
  });
});
