/**
 * Videos at sign-up, and proving they are the artist's own. The providers are
 * replaced by a stub: no request leaves this machine.
 */
import { api, artistRegistration, auth, makeAdmin, makeArtist, prismaAdmin, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prismaAdmin.$disconnect());

const realFetch = global.fetch;

/** A fake YouTube: each id has a channel and a description. */
function stubYouTube(videos: Record<string, { channel: string; description: string } | null>) {
  process.env.CHECK_VIDEO_LINKS = '1';
  global.fetch = jest.fn(async (input: any) => {
    const url = String(input);
    const id = decodeURIComponent(url).match(/v=([A-Za-z0-9_-]{11})/)?.[1] ?? '';
    const video = videos[id];
    if (url.includes('/oembed')) {
      if (!video) return { status: 400, text: async () => 'Bad Request' } as Response;
      return { status: 200, text: async () => JSON.stringify({ author_name: video.channel, author_url: `https://www.youtube.com/@${video.channel}` }) } as Response;
    }
    return { status: 200, text: async () => `<script>var x = {"shortDescription":${JSON.stringify(video?.description ?? '')},"other":1}</script>` } as Response;
  }) as any;
}

afterEach(() => {
  global.fetch = realFetch;
  process.env.CHECK_VIDEO_LINKS = '0';
});

describe('videos at sign-up', () => {
  it('are required, one to three, no duplicates', async () => {
    const none = await api().post('/api/auth/register').send(artistRegistration({ videoUrls: [] }));
    expect(none.status).toBe(400);
    expect(none.body.error.fields.videoUrls).toBeDefined();

    const dup = await api().post('/api/auth/register').send(artistRegistration({ videoUrls: ['https://youtu.be/abcdefghijk', 'https://www.youtube.com/watch?v=abcdefghijk'] }));
    expect(dup.status).toBe(400);

    const notVideo = await api().post('/api/auth/register').send(artistRegistration({ videoUrls: ['https://example.com/me'] }));
    expect(notVideo.status).toBe(400);
  });

  it('are stored on the new profile, with a verification code issued', async () => {
    const body = artistRegistration({ videoUrls: ['https://youtu.be/abcdefghijk', 'https://vimeo.com/1084537'] });
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    const artist = await prismaAdmin.artist.findFirst({ where: { user: { email: body.email } }, select: { verificationCode: true, media: { orderBy: { position: 'asc' } } } });
    expect(artist!.verificationCode).toMatch(/^TA-[A-Z2-9]{6}$/);
    expect(artist!.media.map((m) => [m.provider, m.kind, m.verification])).toEqual([
      ['YOUTUBE', 'VIDEO', 'UNVERIFIED'],
      ['VIMEO', 'VIDEO', 'UNVERIFIED'],
    ]);
  });

  it('are refused when the provider says they do not exist', async () => {
    stubYouTube({});
    const res = await api().post('/api/auth/register').send(artistRegistration({ videoUrls: ['https://youtu.be/zzzzzzzzzzz'] }));
    expect(res.status).toBe(400);
    expect(res.body.error.fields['videoUrls.0']).toBeDefined();
  });
});

describe('proving a video is the artist’s own', () => {
  it('verifies by the code in the description, then the rest of the channel follows', async () => {
    const artist = await makeArtist();
    const { code } = (await api().get('/api/artists/me/verification').set(auth(artist.token))).body.data;
    expect(code).toMatch(/^TA-/);

    stubYouTube({
      aaaaaaaaaa1: { channel: 'SalmaYoga', description: 'Cours au lever du soleil' },
      aaaaaaaaaa2: { channel: 'SalmaYoga', description: 'Session plage' },
      aaaaaaaaaa3: { channel: 'SomeoneElse', description: 'Pas à moi' },
    });

    const first = await api().post('/api/artists/me/videos').set(auth(artist.token)).send({ url: 'https://youtu.be/aaaaaaaaaa1' });
    expect(first.status).toBe(201);
    expect(first.body.data.verification).toBe('UNVERIFIED');
    expect(first.body.data.channel).toBe('SalmaYoga');

    const second = await api().post('/api/artists/me/videos').set(auth(artist.token)).send({ url: 'https://youtu.be/aaaaaaaaaa2' });
    const foreign = await api().post('/api/artists/me/videos').set(auth(artist.token)).send({ url: 'https://youtu.be/aaaaaaaaaa3' });

    // Without the code: not yet.
    const early = await api().post(`/api/artists/me/videos/${first.body.data.id}/verify`).set(auth(artist.token));
    expect(early.body.data.verified).toBe(false);
    expect(early.body.data.outcome).toBe('CODE_NOT_FOUND');

    // The artist writes the code into the description.
    stubYouTube({
      aaaaaaaaaa1: { channel: 'SalmaYoga', description: `Cours au lever du soleil\n${code.toLowerCase()}` },
      aaaaaaaaaa2: { channel: 'SalmaYoga', description: 'Session plage' },
      aaaaaaaaaa3: { channel: 'SomeoneElse', description: 'Pas à moi' },
    });
    const proven = await api().post(`/api/artists/me/videos/${first.body.data.id}/verify`).set(auth(artist.token));
    expect(proven.body.data.verified).toBe(true);
    expect(proven.body.data.outcome).toBe('CODE_IN_DESCRIPTION');

    const rows = await prismaAdmin.media.findMany({ where: { artistId: artist.artistId }, select: { id: true, verification: true, verificationMethod: true } });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId[second.body.data.id]).toMatchObject({ verification: 'VERIFIED', verificationMethod: 'SAME_CHANNEL' });
    expect(byId[foreign.body.data.id].verification).toBe('UNVERIFIED');

    // A later video from the proven channel is verified on arrival.
    stubYouTube({ aaaaaaaaaa4: { channel: 'SalmaYoga', description: '' } });
    const later = await api().post('/api/artists/me/videos').set(auth(artist.token)).send({ url: 'https://youtu.be/aaaaaaaaaa4' });
    expect(later.body.data.verification).toBe('VERIFIED');
  });

  it('refuses a link to a video that does not exist', async () => {
    const artist = await makeArtist();
    stubYouTube({});
    const res = await api().post('/api/artists/me/videos').set(auth(artist.token)).send({ url: 'https://youtu.be/bbbbbbbbbbb' });
    expect(res.status).toBe(400);
    expect(await prismaAdmin.media.count({ where: { artistId: artist.artistId } })).toBe(0);
  });

  it('leaves Instagram to a reviewer, who can verify or reject by hand', async () => {
    const artist = await makeArtist();
    const added = await api().post('/api/artists/me/videos').set(auth(artist.token)).send({ url: 'https://www.instagram.com/reel/ABCdef123/' });
    expect(added.status).toBe(201);
    const check = await api().post(`/api/artists/me/videos/${added.body.data.id}/verify`).set(auth(artist.token));
    expect(check.body.data.outcome).toBe('MANUAL_ONLY');

    const admin = await makeAdmin();
    expect((await api().post(`/api/admin/media/${added.body.data.id}/verification`).set(auth(artist.token)).send({ status: 'VERIFIED' })).status).toBe(403);
    const ruled = await api().post(`/api/admin/media/${added.body.data.id}/verification`).set(auth(admin.token)).send({ status: 'VERIFIED' });
    expect(ruled.status).toBe(200);
    expect(ruled.body.data).toMatchObject({ verification: 'VERIFIED', verificationMethod: 'ADMIN' });
  });
});
