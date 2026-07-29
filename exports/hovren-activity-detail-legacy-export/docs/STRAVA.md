# Strava data

The page does not call Strava directly. Imported fields arrive through the
HOVREN API using the `Activity` contract:

- `stravaActivityId`
- route polyline and coordinates
- distance, duration, elevation, speed, pace and heart rate
- optional media URLs and streams

No Strava credential is present in this archive.
