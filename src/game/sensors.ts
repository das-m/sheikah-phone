import plant1 from '@/assets/images/plants/Electric_Safflina_Icon.png'
import plant2 from '@/assets/images/plants/Hyrule Herb_Icon.png'
import plant3 from '@/assets/images/plants/Warm_Safflina_Icon.png'
import plant4 from '@/assets/images/plants/Armoranth_Icon.png'
import plant5 from '@/assets/images/plants/Mighty_Thistle_Icon.png'
import plant6 from '@/assets/images/plants/Fleet-Lotus Seed_Icon.png'
import plant7 from '@/assets/images/plants/Swift_Violet_Icon.png'
import plant8 from '@/assets/images/plants/Silent_Princess_Icon.png'
import plant9 from '@/assets/images/plants/Blue_Nightshade_Icon.png'
import plant10 from '@/assets/images/plants/Cool_Safflina_Icon.png'
import type { LatLng } from '@/lib/geo'
import type { BeepTuning } from '@/lib/sensorBeep'

/**
 * `available`: the sensor can be selected. `unavailable`: it cannot (extinct, out of season ...), the modal only offers
 * "Zurück" and `statusText` says why.
 */
export type SensorStatus = 'available' | 'unavailable'

/** What a scanned QR code stands for. The id is the QR payload (see `scanTargets.ts`). */
export interface SensorEvent {
  /** The whole QR payload: digits only, a string (`01` is not `1`). */
  id: string
  name: string
  /** Asset URL (import it at the top, like the map icons), shown in the modal. Optional. */
  image?: string
  description: string
  /** Where it is usually found, as text for the player. */
  commonLocations: string
  status: SensorStatus
  /** Why it is not available, shown in the modal. */
  statusText?: string
  /**
   * Where the sensor points to. Without it the sensor can still be selected (the icon shows on the map) but stays
   * silent: nothing to measure.
   */
  location?: LatLng
  /**
   * A "Niete" (red herring): its location is unreachable and it does not matter. The sensor gives only a very quiet,
   * steady signal (`decoyTuning`), never gets excited and never counts as arrived, so the real targets stand out.
   */
  decoy?: boolean
}

/**
 * The one file to edit for the content of the sensor events: the plants of `plants.md` (Zelda names, texts and regions;
 * the cooking effect is not shown). The scanner gets its targets from here (`game/scanTargets.ts`): one per event, the QR
 * code of `id` triggers it. The targets (`location`) and the extinct plants (`unavailable`) come from `plants.md`; 01 still has a test position.
 */
export const sensors: SensorEvent[] = [
  {
    id: '01',
    name: 'Zitterkraut',
    image: plant1,
    description:
      'Diese Heilpflanze ist in der Gerudo-Wüste heimisch. Ihre speziellen energieableitenden Fasern verleihen als Kochzutat Resistenz gegen Elektrizität.',
    commonLocations: 'Gerudo-Wüste\nHyrule-Gebirge',
    status: 'available',
    location: { lat: 48.7802009, lng: 9.1792001 }
  },
  {
    id: '02',
    name: 'Hyrule-Gras',
    image: plant2,
    description:
      'Ein äußerst nahrhaftes Kraut, das überall auf Hyrules Ebenen wächst. Als Kochzutat füllt es noch mehr Herzen auf.',
    commonLocations: 'Ebene von Hyrule\nAkkala-Hochebene',
    status: 'unavailable',
    statusText: 'Ausgestorben (Sensor nicht möglich)'
  },
  {
    id: '03',
    name: 'Glutkraut',
    image: plant3,
    description:
      'Eine Heilpflanze aus warmen Gebieten, etwa der Gerudo-Region. Als Kochzutat verleiht sie kurzzeitig Kälte-Resistenz.',
    commonLocations: 'Gerudo-Wüste\nHyrule-Gebirge',
    status: 'unavailable',
    statusText: 'Ausgestorben (Sensor nicht möglich)'
  },
  {
    id: '04',
    name: 'Rüstgras',
    image: plant4,
    description:
      'Eine robuste Heilpflanze, die nicht abbricht, wenn man auf sie tritt. Ihre festen, aber flexiblen Fasern erhöhen die Abwehr, wenn man sie Gerichten untermischt.',
    commonLocations: 'Akkala-Hochebene\nHyrule-Gebirge',
    status: 'available',
    location: { lat: 36.581105, lng: 84.634203 },
    decoy: true
  },
  {
    id: '05',
    name: 'Schwertgras',
    image: plant5,
    description:
      'Diese Heilpflanze weist spitze Dornen an Blättern und Frucht auf. Sie enthält Vitamine, welche die Körperkraft erhöhen. Als Zutat verleiht sie einen Bonus auf Angriffskraft.',
    commonLocations: 'West-Necluda\nPrärie von Phirone',
    status: 'available',
    location: { lat: 58.939224, lng: 85.051683 },
    decoy: true
  },
  {
    id: '06',
    name: 'Spurtlotos',
    image: plant6,
    description:
      'Lotosfrüchte findet man in seichten Wassern. Ihre Nährstoffe ziehen sie mit langen Wurzeln aus dem Boden. Als Kochzutat steigern sie die Fortbewegungsgeschwindigkeit.',
    commonLocations: 'Sumpf von Ranelle\nQuellen von Ranelle',
    status: 'available',
    location: { lat: -3.972795, lng: 141.916917 },
    decoy: true
  },
  {
    id: '07',
    name: 'Spurtveilchen',
    image: plant7,
    description:
      'Eine essbare Blume, die an Abhängen wächst und reich an wichtigen Mineralien ist. Als Kochzutat verhelfen diese zu einer verbesserten Laufgeschwindigkeit.',
    commonLocations: 'Gerudo-Hochebene\nHebra-Berge',
    status: 'available',
    location: { lat: -29.400388, lng: -70.07527 },
    decoy: true
  },
  {
    id: '08',
    name: 'Prinzessinnen-Enzian',
    image: plant8,
    description:
      'Dies soll die Lieblingsblume der Prinzessin von Hyrule gewesen sein. Man hielt sie für ausgestorben, doch in den letzten Jahren wurden wieder ein paar Exemplare gefunden.',
    commonLocations: 'Akkala-Hochebene\nHyrule-Gebirge',
    status: 'available',
    location: { lat: 48.902331, lng: 9.183109 }
  },
  {
    id: '09',
    name: 'Schleichglöckchen',
    image: plant9,
    description:
      'Eine Blume, die in Wäldern und auf Wiesen zu finden ist. Nachts gibt sie ein schwaches Licht ab. Als Kochzutat verleiht sie die Fähigkeit, lautlos zu schleichen.',
    commonLocations: 'West-Necluda\nQuellen von Ranelle',
    status: 'unavailable',
    statusText: 'Ausgestorben (Sensor nicht möglich)'
  },
  {
    id: '10',
    name: 'Frostkraut',
    image: plant10,
    description:
      'Eine Heilpflanze, die in großen Höhen wächst, etwa in den Bergen von Hebra und Gerudo. Als Kochzutat entfaltet das Kraut einen Hitzeschutz-Effekt.',
    commonLocations: 'Hebra-Berge\nGerudo-Hochebene',
    status: 'unavailable',
    statusText: 'Ausgestorben (Sensor nicht möglich)'
  }
]

/** The sensor event of a QR id, or null. */
export function findSensor(id: string): SensorEvent | null {
  return sensors.find((sensor) => sensor.id === id) ?? null
}

/** The signal starts when the phone points at the target within this angle (degrees). */
export const SENSOR_FACING_TOLERANCE_DEG = 30
/** Once started, the signal only stops when the phone points past this angle (degrees): no stutter at the edge. */
export const SENSOR_FACING_RELEASE_DEG = 45

/** How the sensor beeps (see `lib/sensorBeep.ts`). Untested on a real phone: tune there. */
export const sensorTuning: BeepTuning = {
  nearMeters: 10,
  // The real targets are within the city: calm beyond ~800 m, the rhythm picks up only well inside it (linear curve).
  farMeters: 800,
  fastIntervalMs: 300,
  slowIntervalMs: 3000,
  curve: 1,
  centerIntervalFactor: 0.5,
  aimEdgeDeg: SENSOR_FACING_TOLERANCE_DEG,
  farVolume: 0.12,
  nearVolume: 1,
  foundMinMeters: 10,
  foundMaxMeters: 25,
  foundIntervalMs: 250
}

/** A decoy ("Niete", see `SensorEvent.decoy`): very quiet and slow whatever the distance and the aim. */
export const decoyTuning: BeepTuning = {
  ...sensorTuning,
  fastIntervalMs: 4000,
  slowIntervalMs: 4000,
  centerIntervalFactor: 1,
  farVolume: 0.04,
  nearVolume: 0.04,
  foundIntervalMs: 4000
}

/** The player came into the found radius of the active sensor. */
export function onSensorArrived(sensor: SensorEvent) {
  // TODO(arrival): what happens at the target (a hint to scan the code, unlocking content ...).
  void sensor
}
