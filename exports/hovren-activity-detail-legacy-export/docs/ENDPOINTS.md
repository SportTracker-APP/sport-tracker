# Endpoints

- `GET /activities/:id`: loads the authenticated user's activity.
- `GET /activities/:id/planned-workout-suggestion`: loads an optional planned
  workout match.
- `POST /activities/planned-workouts/:plannedWorkoutId/complete`: confirms a
  planned workout match.
- `GET /summits`: supplies the summit overlay used by the activity map.

The consuming backend remains responsible for authentication, ownership and
authorization.
