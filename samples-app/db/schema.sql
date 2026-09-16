CREATE TABLE IF NOT EXISTS samples (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  title text NOT NULL,
  summary text NOT NULL,
  category text NOT NULL,
  body text NOT NULL,
  published boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS sample_views (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  viewer_id text NOT NULL,
  email text NOT NULL,
  sample_slug text NOT NULL REFERENCES samples(slug),
  broker text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  view_day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  UNIQUE (viewer_id, sample_slug, view_day)
);
CREATE TABLE IF NOT EXISTS notification_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  first_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  UNIQUE (email, day)
);
