# Gym Flow Tracker

You are a senior Django + React architect.

Build a production-ready Gym Workout Tracker application.

Tech Stack

Backend

- Python 3.13

- Django 5

- Django REST Framework

- PostgreSQL

- Django Admin

- JWT Authentication (SimpleJWT)

- CORS Headers

- Pillow (for images if needed)

Frontend

- React

- TypeScript

- Vite

- TailwindCSS

- React Router

- Axios

- React Query

- Zustand

- React Hook Form

The UI should be mobile-first because the app will primarily be used inside a gym.

---

Goal

---

This is NOT a calorie tracker.

This is NOT a bodybuilding social app.

The purpose is simple:

Open app

↓

Select today's workout

↓

See exercises one by one

↓

Mark completed

↓

Move to next exercise

↓

Track weights and reps

---

Authentication

---

Implement

- Register

- Login

- Logout

- Refresh Token

---

Workout Split

---

Seed the database with the following split.

Monday

Back

- Weighted Pull-ups

- Lat Pulldown

- Reverse Grip Lat Pulldown

- Cable Row

- Single Arm Dumbbell Row

- Conventional Deadlift

Biceps

- Barbell Curl

- Dumbbell Curl

- Hammer Curl

Tuesday

Chest

- Bench Press

- Incline Dumbbell Press

- Pec Deck Fly

- Weighted Dips

Shoulders

- Side Lateral Raise

- Dumbbell Press

- Reverse Fly

- Shrugs

Wednesday

Legs

- Squat

- Romanian Deadlift

- Leg Press

- Leg Extension

- Calf Raise

Triceps

- V-Bar Overhead Extension

- V-Bar Pushdown

Thursday

Back

- Lat Pulldown

- Reverse Grip Lat Pulldown

- Cable Row

- Single Arm Dumbbell Row

Biceps

- Preacher Curl

- Hammer Curl

- Dumbbell Curl

Friday

Chest

- Flat Dumbbell Press

- Smith Machine Incline Press

- Dips

- Dumbbell Fly

Shoulders

- Military Press

- Cable Lateral Raise

- Face Pull

- Shrugs

Saturday

Legs

- Front Squat

- Sumo Squat

- Leg Curl

- Calf Raise

Triceps

- Cross Cable Triceps Extension

- Rope Pushdown

---

Database Design

---

Create proper normalized models.

User

WorkoutDay

MuscleGroup

Exercise

WorkoutExercise

WorkoutSession

WorkoutSet

ExerciseMedia

ExerciseAlternative

The relationships should be scalable.

Do NOT hardcode exercises.

---

Exercise Model

---

Each exercise should contain

name

slug

description

primary_muscle

secondary_muscles

equipment

difficulty

video_url

gif_url

image_url

instructions

tips

created_at

updated_at

is_active

---

Workout Session

---

Each workout session stores

date

day

exercise

set number

weight

reps

rir

completed

notes

---

Features

---

Dashboard

Today's workout

Progress bar

Current exercise card

Exercise GIF

Previous workout weight

Start Rest Timer

Complete Set

Next Exercise

Previous Exercise

Workout Summary

---

Exercise Detail

Show

GIF

Instructions

Common mistakes

Muscles worked

Equipment

Tips

---

REST Timer

60

90

120

180 seconds

Custom timer

Automatically move to next set after timer ends.

---

Admin Panel

The admin panel should allow me to

Create workout days

Create muscle groups

Create exercises

Upload GIF

Upload Image

Upload Video URL

Arrange workout order

Add/remove exercises

Enable/disable exercises

Change exercise order with drag ordering field

Everything should be editable from Django Admin.

---

IMPORTANT FEATURE

The workout split should NOT be hardcoded.

I should be able to

Create a new exercise

↓

Assign muscle group

↓

Assign workout day

↓

Choose exercise order

↓

Save

Without changing any code.

---

Future Ready

Design database so I can later support

Custom workout plans

Different users having different workout splits

Push Pull Legs

Arnold Split

Upper Lower

Powerlifting

Bodybuilding

---

API

Create REST APIs for everything.

Use ViewSets.

Use serializers.

Proper permissions.

Pagination.

Filtering.

Searching.

---

Frontend

Beautiful dark theme.

Mobile first.

Cards.

Minimal UI.

One tap navigation.

Bottom navigation.

Large buttons for gym usage.

---

Exercise Screen

Large exercise GIF

Exercise name

Target muscles

Current set

Weight input

Reps input

Save Set

Next

Previous

Rest Timer

Workout Progress

---

Extra Features

Progressive overload suggestion

Previous workout comparison

Workout streak

Exercise search

Favorite exercises

Notes

---

Code Quality

Use

Services

Repositories if needed

Type hints

DRF Best Practices

Reusable components

Proper folder structure

Environment variables

Docker

docker-compose

README

API documentation using Swagger

---

Deliverables

Generate

Complete Django Backend

Complete React Frontend

Docker setup

Seed script

Postman Collection

README

Do not leave placeholders.

Build a working MVP with clean architecture and production-ready code.

======================================================

SMART EXERCISE REPLACEMENT ENGINE

======================================================

One of the core features of this application is intelligent exercise replacement.

If an exercise cannot be performed because

- equipment is occupied

- equipment does not exist

- user has an injury

- user simply prefers another exercise

the application should recommend the closest alternatives.

The replacement should NOT be random.

The replacement engine should rank exercises according to

1. Same movement pattern

2. Same primary muscle

3. Same secondary muscles

4. Same equipment category

5. Similar difficulty

6. Similar fatigue level

7. Similar hypertrophy stimulus

Every exercise should belong to one movement pattern.

Examples

Horizontal Push

Vertical Push

Horizontal Pull

Vertical Pull

Squat

Hip Hinge

Isolation Curl

Isolation Extension

Calf

Core

Carry

Every exercise should also have

primary_muscle

secondary_muscles

equipment

difficulty

movement_pattern

fatigue_score

stability_requirement

---

Example

Bench Press

movement_pattern = Horizontal Push

primary = Chest

secondary = Front Delts

secondary = Triceps

equipment = Barbell

Alternative ranking

1. Dumbbell Bench Press

2. Smith Machine Bench

3. Machine Chest Press

4. Incline Dumbbell Press

5. Push Ups

---

Lat Pulldown

1. Pull Ups

2. Assisted Pull Ups

3. Neutral Grip Pulldown

4. Chin Ups

5. Straight Arm Pulldown

---

Cable Row

1. Chest Supported Row

2. Machine Row

3. T Bar Row

4. Barbell Row

5. Dumbbell Row

---

Squat

1. Front Squat

2. Hack Squat

3. Leg Press

4. Goblet Squat

5. Bulgarian Split Squat

---

Romanian Deadlift

1. Stiff Leg Deadlift

2. Dumbbell Romanian Deadlift

3. Good Morning

4. Hip Thrust

5. Back Extension

---

Shoulder Press

1. Dumbbell Shoulder Press

2. Machine Shoulder Press

3. Arnold Press

4. Landmine Press

5. Pike Push Up

---

Lateral Raise

1. Cable Lateral Raise

2. Machine Lateral Raise

3. Leaning Cable Raise

4. Single Arm Cable Raise

5. Dumbbell Lateral Raise

---

Face Pull

1. Reverse Pec Deck

2. Rear Delt Fly

3. Band Face Pull

4. Cable Reverse Fly

5. Chest Supported Rear Delt Raise

---

Barbell Curl

1. EZ Bar Curl

2. Dumbbell Curl

3. Cable Curl

4. Preacher Curl

5. Machine Curl

---

Hammer Curl

1. Rope Hammer Curl

2. Cross Body Hammer Curl

3. Cable Hammer Curl

4. Dumbbell Hammer Curl

5. Machine Neutral Curl

---

Triceps Pushdown

1. Rope Pushdown

2. Straight Bar Pushdown

3. V Bar Pushdown

4. Resistance Band Pushdown

5. Assisted Dip

---

Leg Extension

1. Sissy Squat

2. Spanish Squat

3. Bulgarian Split Squat

4. Goblet Squat

5. Hack Squat

---

Leg Curl

1. Romanian Deadlift

2. Nordic Curl

3. Glute Ham Raise

4. Stability Ball Curl

5. Seated Leg Curl

---

Calf Raise

1. Standing Calf Raise

2. Seated Calf Raise

3. Leg Press Calf Raise

4. Smith Machine Calf Raise

5. Single Leg Calf Raise

---

The backend should automatically compute similarity between exercises.

Each exercise should contain

related_exercises

similarity_score

reason

Example

Bench Press

↓

Dumbbell Bench Press

Similarity

97%

Reason

Same movement pattern.

Same muscles.

Different equipment.

---

The frontend should provide a

Replace Exercise

button.

When clicked

Display the Top 5 alternatives.

Each alternative should display

Exercise Name

Similarity %

Primary Muscle

Equipment Required

Difficulty

GIF Preview

Reason why it was selected

---

If the selected equipment is unavailable

Example

Smith Machine occupied

then every Smith Machine exercise should automatically disappear from the replacement list.

Likewise if the user selects

Available Equipment

☑ Dumbbells

☑ Cable

☑ Pull Up Bar

☑ Bench

☑ Barbell

☐ Smith Machine

☐ Hack Squat

☐ Leg Press

the replacement engine should only recommend exercises that can actually be performed.

---

The replacement engine should be entirely database driven.

I should be able to add

new exercises

new equipment

new movement patterns

new muscles

without changing any backend logic.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chetan71-workout.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/67cb0f5d-37ba-4ee9-8802-b08ef3aa0116).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
