export type BePlayerRecord = {
  beNumber: string
  name: string
  club: string
  county: string
  maskedEmail: string
}

/** Prototype-only directory — includes duplicate names for search demos. */
export const BE_PLAYER_DIRECTORY: BePlayerRecord[] = [
  {
    beNumber: '1206628',
    name: 'Simon Parker',
    club: 'Cambridge BC',
    county: 'Cambridgeshire',
    maskedEmail: 'sim***@gmail.com',
  },
  {
    beNumber: '1184321',
    name: 'Simon Parker',
    club: 'Milton Keynes BC',
    county: 'Buckinghamshire',
    maskedEmail: 'sim***@outlook.com',
  },
  {
    beNumber: '1155099',
    name: 'Simon Parker',
    club: 'Peterborough BC',
    county: 'Cambridgeshire',
    maskedEmail: 'sim***@yahoo.co.uk',
  },
  {
    beNumber: '1221044',
    name: 'James Smith',
    club: 'Essex County BC',
    county: 'Essex',
    maskedEmail: 'jam***@gmail.com',
  },
  {
    beNumber: '1198872',
    name: 'James Smith',
    club: 'Surrey Smashers',
    county: 'Surrey',
    maskedEmail: 'jam***@icloud.com',
  },
  {
    beNumber: '1000001',
    name: 'Emma Wilson',
    club: 'London BC',
    county: 'London',
    maskedEmail: 'emm***@gmail.com',
  },
  {
    beNumber: '1215503',
    name: 'Christopher Parker',
    club: 'Cambridge BC',
    county: 'Cambridgeshire',
    maskedEmail: 'chr***@outlook.com',
  },
  {
    beNumber: '1172208',
    name: 'Sarah Chen',
    club: 'Oxford University BC',
    county: 'Oxfordshire',
    maskedEmail: 'sar***@gmail.com',
  },
  {
    beNumber: '1230091',
    name: 'Alex Taylor',
    club: 'Norfolk BC',
    county: 'Norfolk',
    maskedEmail: 'ale***@yahoo.co.uk',
  },
  {
    beNumber: '1167745',
    name: 'Alex Taylor',
    club: 'Brighton BC',
    county: 'East Sussex',
    maskedEmail: 'ale***@icloud.com',
  },
]

export function searchBePlayers(query: string): BePlayerRecord[] {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length < 2) return []

  return BE_PLAYER_DIRECTORY.filter((player) => {
    const haystack = `${player.name} ${player.club} ${player.county} ${player.beNumber}`.toLowerCase()
    return haystack.includes(trimmed)
  }).slice(0, 8)
}

export function findBePlayerByNumber(beNumber: string): BePlayerRecord | undefined {
  return BE_PLAYER_DIRECTORY.find((player) => player.beNumber === beNumber.trim())
}
