import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'profile' },
    document: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { collection: 'profile', versionKey: false },
);

const statsSchema = new mongoose.Schema(
  {
    _id: { type: String },
    value: { type: Number, default: 0 },
  },
  { collection: 'stats', versionKey: false },
);

export const Profile = mongoose.model('Profile', profileSchema);
export const Stats = mongoose.model('Stats', statsSchema);

let connected = false;

/**
 * Connects to MongoDB. Failure is not fatal: the API keeps serving the
 * profile from the bundled JSON so visitors never see a 500.
 */
export async function connect(uri, { retries = 10, delayMs = 3000 } = {}) {
  if (!uri) {
    console.warn('[db] MONGO_URL is not set, running without MongoDB');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      connected = true;
      console.log('[db] connected');
      return true;
    } catch (error) {
      console.warn(`[db] attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('[db] giving up, falling back to file-backed profile');
  return false;
}

export function isConnected() {
  return connected && mongoose.connection.readyState === 1;
}

export async function seedProfile(document) {
  if (!isConnected()) return false;
  await Profile.updateOne(
    { _id: 'profile' },
    { $setOnInsert: { document } },
    { upsert: true },
  );
  return true;
}

export async function readProfile() {
  if (!isConnected()) return null;
  const record = await Profile.findById('profile').lean();
  return record?.document ?? null;
}

/** Atomically increments a named counter and returns the new value. */
export async function bumpCounter(name) {
  if (!isConnected()) return null;
  const record = await Stats.findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return record?.value ?? null;
}

export async function readCounter(name) {
  if (!isConnected()) return null;
  const record = await Stats.findById(name).lean();
  return record?.value ?? null;
}

export async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  connected = false;
}
