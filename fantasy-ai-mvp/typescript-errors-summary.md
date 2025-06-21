# TypeScript Error Summary

## Overview
- **Total TypeScript Errors**: 752 errors
- **Files with Errors**: 49 files

## Error Type Breakdown

### Most Common Error Types:
1. **TS2339** (582 errors) - Property does not exist on type
2. **TS2551** (39 errors) - Property does not exist, did you mean...
3. **TS7053** (25 errors) - Element implicitly has 'any' type
4. **TS7006** (22 errors) - Parameter implicitly has 'any' type
5. **TS2322** (21 errors) - Type is not assignable
6. **TS2345** (13 errors) - Argument type is not assignable
7. **TS2353** (11 errors) - Object literal may only specify known properties
8. **TS2304** (7 errors) - Cannot find name
9. **TS2393** (6 errors) - Duplicate function implementation
10. **TS2307** (5 errors) - Cannot find module

## Files with Most Errors:
1. `src/lib/universal-consciousness-interface.ts` - 125 errors
2. `src/lib/agi-fantasy-commissioner.ts` - 104 errors
3. `src/lib/interplanetary-communication-system.ts` - 97 errors
4. `src/lib/reality-simulation-engine.ts` - 91 errors
5. `src/lib/time-traveling-prediction-engine.ts` - 67 errors
6. `src/lib/autonomous-league-management.ts` - 55 errors
7. `src/lib/league-wagering-manager.ts` - 51 errors
8. `src/lib/psychological-warfare.ts` - 19 errors
9. `src/lib/predictive-injury-ai.ts` - 16 errors
10. `src/lib/neuralink-interface.ts` - 15 errors

## Key Issues to Address:

### 1. Missing Methods (TS2339)
Most errors are due to methods being called but not implemented in their respective classes. This affects:
- AGI Fantasy Commissioner
- Universal Consciousness Interface
- Reality Simulation Engine
- Time Traveling Prediction Engine

### 2. Missing Type Declarations
- `socket.io-client` module needs to be installed
- `socket.io` module needs to be installed
- Web Speech API types (`SpeechRecognition`, `SpeechRecognitionEvent`)

### 3. Type Mismatches
- NeonButton color prop accepts limited values but "red" is being passed
- AROverlay components missing required `interactive` property
- Various string types being used where specific literal types are expected

### 4. Implicit Any Types
- Several callback functions and parameters lack type annotations
- Object property access using dynamic keys without proper typing

### 5. Component Props Issues
- GlassCard doesn't accept `onClick` prop
- PlayerCard component receiving unexpected `position` prop
- BufferAttribute missing required `args` property

## Recommended Fix Priority:
1. Install missing dependencies (`socket.io`, `socket.io-client`)
2. Add Web Speech API type definitions
3. Implement missing methods in core classes
4. Fix component prop types
5. Add proper type annotations to eliminate implicit any
6. Update string literals to match expected union types