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
  // Surname demos for notes picker disambiguation (BadMinfo-style search)
  {
    beNumber: '1419401',
    name: 'Alexandra Simon',
    club: 'Ealing BC',
    county: 'Middlesex',
    maskedEmail: 'ale***@gmail.com',
  },
  {
    beNumber: '1195857',
    name: 'Edwin Simon',
    club: 'Guildford BC',
    county: 'Surrey',
    maskedEmail: 'edw***@outlook.com',
  },
  {
    beNumber: '1315265',
    name: 'Joel Simon',
    club: 'Chelmsford BC',
    county: 'Essex',
    maskedEmail: 'joe***@icloud.com',
  },
  {
    beNumber: '1323880',
    name: 'Joseph Simon',
    club: 'Maidstone BC',
    county: 'Kent',
    maskedEmail: 'jos***@yahoo.co.uk',
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

export function findBePlayersByName(name: string): BePlayerRecord[] {
  const key = name.trim().toLowerCase()
  if (!key) return []
  return BE_PLAYER_DIRECTORY.filter((player) => player.name.trim().toLowerCase() === key)
}
