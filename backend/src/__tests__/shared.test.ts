import {
  checkEmail,
  looksLikePlaceholder,
  normalizePhone,
  parseFrenchDate,
  artistRegistrationSchema,
  hotelRegistrationSchema,
  bookingCreateSchema,
  fieldErrors,
} from '../shared/validation';
import { categoryErrors, disciplineLabel } from '../shared/categories';
import { parseVideoUrl } from '../shared/media';
import { canTransition, allowedTransitions } from '../shared/status';
import { artistRegistration, bookingBody } from './helpers';

describe('email rules', () => {
  it.each([
    ['test@test.com', 'Utilisez votre véritable adresse e-mail'],
    ['jean@example.com', 'Utilisez votre véritable adresse e-mail'],
    ['jean@yopmail.com', 'Les adresses e-mail jetables ne sont pas acceptées'],
    ['jean@mailinator.com', 'Les adresses e-mail jetables ne sont pas acceptées'],
    ['test123@gmail.com', 'Utilisez votre véritable adresse e-mail'],
    ['jean..dupont@gmail.com', 'Adresse e-mail invalide'],
    ['jean@gmail', 'Adresse e-mail invalide'],
  ])('refuses %s', (email, message) => {
    const verdict = checkEmail(email);
    expect(verdict.ok).toBe(false);
    expect(verdict.message).toBe(message);
  });

  it('suggests the common domain for a typo', () => {
    const verdict = checkEmail('jean@gmial.com');
    expect(verdict.ok).toBe(false);
    expect(verdict.suggestion).toBe('jean@gmail.com');
  });

  it.each(['Jean.Dupont@Gmail.com', 'admin@hotel-atlas.ma', 'reservation@riad-yasmine.com', 'contact@menara.ma'])(
    'accepts and normalises %s',
    (email) => {
      const verdict = checkEmail(email);
      expect(verdict.ok).toBe(true);
      expect(verdict.email).toBe(email.toLowerCase());
    }
  );
});

describe('name rules', () => {
  it.each(['test test', 'aaaa', 'xx', 'Hotel', 'asdf qwerty', '1234'])('flags %s as a placeholder', (name) => {
    expect(looksLikePlaceholder(name)).toBe(true);
  });
  it.each(['Bart Testa', 'Jean-Pierre', 'Oum Kalthoum', 'DJ Snake', 'Riad Yasmine'])('accepts %s', (name) => {
    expect(looksLikePlaceholder(name)).toBe(false);
  });
});

describe('phone and date rules', () => {
  it('reads a local number against the country', () => {
    expect(normalizePhone('06 12 34 56 78', 'Morocco')).toBe('+212612345678');
    expect(normalizePhone('06 12 34 56 78', 'France')).toBe('+33612345678');
    expect(normalizePhone('12', 'France')).toBeNull();
  });
  it('refuses impossible dates', () => {
    expect(parseFrenchDate('31/02/2000')).toBeNull();
    expect(parseFrenchDate('29/02/1996')?.toISOString().slice(0, 10)).toBe('1996-02-29');
  });
});

describe('artist registration schema', () => {
  it('accepts a yoga teacher, a tribute act and a plastic artist', () => {
    for (const overrides of [
      {},
      { mainCategory: 'Musique', categoryType: 'Tribute / Hommage', specificCategory: 'Tribute groupe', tributeTo: 'Queen' },
      { mainCategory: 'Visuel', categoryType: 'Arts plastiques', specificCategory: 'Sculpture' },
    ]) {
      const result = artistRegistrationSchema.safeParse(artistRegistration(overrides));
      expect(result.success ? 'ok' : fieldErrors(result.error)).toBe('ok');
    }
  });

  it('names every bad field', () => {
    const result = artistRegistrationSchema.safeParse(
      artistRegistration({
        firstName: 'test',
        birthDate: '01/01/2015',
        email: 'test@test.com',
        phone: '123',
        mainCategory: 'Musique',
        categoryType: 'Tribute / Hommage',
        specificCategory: 'Tribute solo',
        tributeTo: '',
      })
    );
    expect(result.success).toBe(false);
    const fields = fieldErrors((result as any).error);
    expect(Object.keys(fields).sort()).toEqual(['birthDate', 'email', 'firstName', 'phone', 'tributeTo'].sort());
    expect(fields.birthDate).toMatch(/18 ans/);
  });

  it('refuses a category type outside the main category', () => {
    expect(categoryErrors({ mainCategory: 'Bien-être', categoryType: 'DJ' })).toEqual({
      categoryType: 'Choisissez votre famille artistique',
    });
    expect(disciplineLabel({ mainCategory: 'Musique', categoryType: 'Tribute / Hommage', specificCategory: 'Tribute groupe', tributeTo: 'Queen' })).toBe(
      'Musique - Tribute groupe (Queen)'
    );
  });
});

describe('hotel registration schema', () => {
  it('keeps every structured answer and checks social links', () => {
    const base = {
      role: 'HOTEL',
      name: 'Riad Yasmine',
      contactName: 'Nadia Alaoui',
      city: 'Marrakech',
      email: 'contact@riad-yasmine.com',
      password: 'Sup3r-Secret!',
      phone: '0524 38 11 22',
      country: 'Morocco',
      acceptTerms: true,
      roomCount: '24',
      instagramUrl: 'https://www.instagram.com/riadyasmine',
      spaces: [{ name: 'Rooftop', setting: 'OUTDOOR', capacity: '80', media: [] }],
      programme: { styles: ['Chill / Lounge'], offersLodging: true, perWeek: '2' },
    };
    const ok = hotelRegistrationSchema.safeParse(base);
    expect(ok.success).toBe(true);
    expect((ok as any).data.roomCount).toBe(24);
    expect((ok as any).data.spaces[0].capacity).toBe(80);
    expect((ok as any).data.programme.perWeek).toBe(2);

    const bad = hotelRegistrationSchema.safeParse({ ...base, instagramUrl: 'https://facebook.com/riad' });
    expect(fieldErrors((bad as any).error).instagramUrl).toMatch(/Instagram/);
  });
});

describe('video links', () => {
  it('extracts provider ids and refuses look-alikes', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=3')?.externalId).toBe('dQw4w9WgXcQ');
    expect(parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(parseVideoUrl('https://vimeo.com/123456789')?.embedUrl).toBe('https://player.vimeo.com/video/123456789');
    expect(parseVideoUrl('https://www.instagram.com/reel/Cabc123/')?.provider).toBe('INSTAGRAM');
    expect(parseVideoUrl('https://evil.example/?youtube.com')).toBeNull();
    expect(parseVideoUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('booking rules', () => {
  it('lets only the right party make each move', () => {
    expect(canTransition('PENDING', 'CONFIRMED', 'ARTIST')).toBe(true);
    expect(canTransition('PENDING', 'CONFIRMED', 'HOTEL')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED', 'ARTIST')).toBe(false);
    expect(canTransition('CONFIRMED', 'CANCELLED', 'HOTEL')).toBe(true);
    expect(allowedTransitions('COMPLETED', 'ADMIN')).toEqual([]);
  });

  it('requires the convention terms', () => {
    const result = bookingCreateSchema.safeParse({ ...bookingBody('h', 'a'), boardType: undefined, performanceDescription: 'court' });
    const fields = fieldErrors((result as any).error);
    expect(fields.boardType).toBeDefined();
    expect(fields.performanceDescription).toBeDefined();
    const ok = bookingCreateSchema.safeParse(bookingBody('h', 'a'));
    expect((ok as any).data.stayValue).toBe(120000);
  });
});
