# BirdieBank - Golf Score Tracking App

BirdieBank is a comprehensive golf score tracking application built with React Native and Expo. It allows golfers to track their rounds, manage players, select courses, and play various golf gambling games.

## Features

- **User Authentication**: Secure login and registration via Supabase
- **Course Management**: Browse and select from a database of golf courses
- **Geolocation**: Find nearby golf courses based on your current location
- **Player Management**: Add and manage players, including guest players
- **Tee Selection**: Choose different tees for each player
- **Hole Selection**: Play Front 9, Back 9, Full 18, or custom starting hole
- **Score Tracking**: Easy-to-use scorecard interface for tracking scores
- **Game Types**: Support for various golf gambling games (Nassau, Skins, Match Play, etc.)
- **Round History**: View past rounds and performance statistics
- **Round Summary**: Detailed end-of-round summary with individual scorecards

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **TypeScript**: Type-safe JavaScript
- **Redux Toolkit**: State management
- **Expo Router**: File-based routing system
- **Supabase**: Backend as a Service for authentication and database
- **Expo Location**: Geolocation services
- **Expo Haptics**: Haptic feedback for better user experience

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/birdiebank.git
cd birdiebank
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Update the Supabase configuration in `lib/supabase.ts` with your credentials.

5. Start the development server:
```bash
npx expo start
```

## Project Structure

```
birdiebank/
├── app/                    # Expo Router app directory
│   ├── (tabs)/             # Tab navigation screens
│   ├── auth/               # Authentication screens
│   ├── rounds/             # Round details screens
│   ├── courses/            # Course details screens
│   └── _layout.tsx         # Root layout component
├── assets/                 # Static assets
├── components/             # Reusable components
├── constants/              # App constants and theme
├── lib/                    # Utility libraries
├── store/                  # Redux store and slices
│   └── slices/             # Redux slices for state management
└── types/                  # TypeScript type definitions
```

## Database Schema

### Users
- id (UUID)
- email (String)
- created_at (Timestamp)

### Players
- id (UUID)
- userId (UUID, Foreign Key to Users)
- name (String)
- handicapIndex (Number, Optional)
- profileImageUrl (String, Optional)
- isGuest (Boolean)

### Courses
- id (UUID)
- name (String)
- location (JSON with latitude, longitude, address)
- tees (JSON Array)
- holes (JSON Array)
- imageUrl (String, Optional)

### Rounds
- id (UUID)
- userId (UUID, Foreign Key to Users)
- courseId (UUID, Foreign Key to Courses)
- date (Timestamp)
- players (JSON Array)
- holeSelection (String: 'front9', 'back9', 'full18', 'custom')
- customStartHole (Number, Optional)
- scores (JSON Array)
- isCompleted (Boolean)
- games (JSON Array, Optional)
- weather (JSON, Optional)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Golf course data provided by [source]
- Icons from FontAwesome
- Design inspiration from [source]
