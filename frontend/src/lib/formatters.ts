/**
 * Utility Functions for Data Formatting
 * ======================================
 *
 * Helper functions to format database strings for display in the UI.
 */

/**
 * Format symptom strings from database format to display format
 *
 * Converts: "sore_throat" → "Sore Throat"
 * Converts: "body_ache" → "Body Ache"
 * Converts: "fever" → "Fever"
 *
 * @param symptom - Raw symptom string from database
 * @returns Formatted symptom string for display
 */
export function formatSymptom(symptom: string): string {
  if (!symptom) return '';

  return symptom
    .split('_')                    // Split by underscores: "sore_throat" → ["sore", "throat"]
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()  // Capitalize first letter
    )
    .join(' ');                    // Join with spaces: ["Sore", "Throat"] → "Sore Throat"
}

/**
 * Format multiple symptoms
 *
 * @param symptoms - Array of symptom strings
 * @returns Array of formatted symptom strings
 */
export function formatSymptoms(symptoms: string[]): string[] {
  if (!symptoms || symptoms.length === 0) return [];
  return symptoms.map(formatSymptom);
}

/**
 * Get user initials from full name
 *
 * Examples:
 *  "John Doe" → "JD"
 *  "Alice" → "A"
 *  "Mary Jane Watson" → "MW"
 *
 * @param fullName - User's full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return '??';

  const names = fullName.trim().split(' ').filter(n => n.length > 0);

  if (names.length === 0) return '??';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();

  // Take first and last name initials
  const firstInitial = names[0].charAt(0).toUpperCase();
  const lastInitial = names[names.length - 1].charAt(0).toUpperCase();

  return firstInitial + lastInitial;
}

/**
 * Get color class for initials avatar based on name
 * Provides consistent color for same name
 *
 * @param fullName - User's full name
 * @returns Tailwind CSS color classes
 */
export function getAvatarColorClass(fullName: string | null | undefined): string {
  if (!fullName) return 'bg-gray-500';

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];

  // Hash the name to get consistent color
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Format temperature with degree symbol
 *
 * @param temperature - Temperature value
 * @param unit - Unit (C or F), defaults to C
 * @returns Formatted temperature string
 */
export function formatTemperature(temperature: number | null | undefined, unit: 'C' | 'F' = 'C'): string {
  if (temperature === null || temperature === undefined) return 'N/A';
  return `${temperature.toFixed(1)}°${unit}`;
}

/**
 * Format date to relative time or absolute date
 *
 * Examples:
 *  Today → "Today at 3:45 PM"
 *  Yesterday → "Yesterday at 10:30 AM"
 *  Older → "Jan 25, 2026"
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Format severity level with proper casing
 *
 * @param severity - Severity level from database
 * @returns Formatted severity string
 */
export function formatSeverity(severity: string | null | undefined): string {
  if (!severity) return 'Unknown';
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}
