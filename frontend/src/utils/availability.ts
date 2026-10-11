import type { ArtistAvailability } from '@/types'
import { t } from '@/i18n'

/**
 * "Maroc · Europe · Royal Mansour" - the zones and hotels an artist chose for
 * a period, or '' when none was chosen. Hotels are named from the period's
 * own list when the API sent one, else from `known`.
 */
export function availabilityChoices(p: ArtistAvailability, known: { id: string; name: string }[] = []): string {
  const zones = (p.preferredZones ?? []).map((z) => t(z))
  const hotels = (p.preferredHotelIds ?? [])
    .map((id) => p.preferredHotels?.find((h) => h.id === id)?.name ?? known.find((h) => h.id === id)?.name)
    .filter((n): n is string => Boolean(n))
  const all = [...zones, ...hotels]
  return all.length ? `${t('Souhaits :')} ${all.join(' · ')}` : ''
}
