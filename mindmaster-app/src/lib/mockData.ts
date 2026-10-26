import { Course, Lesson, Book } from "./types";

// Production Clean Slate: 0 Fake Courses
export const MOCK_COURSES: Course[] = [];

// Seed UUID map for database joins
export const COURSE_ID_MAP: Record<string, string> = {
  "c-mm-01": "11111111-1111-1111-1111-111111111101",
  "c-mm-02": "11111111-1111-1111-1111-111111111102",
  "c-mm-03": "11111111-1111-1111-1111-111111111103",
  "c-mm-04": "11111111-1111-1111-1111-111111111104",
  "c-mm-05": "11111111-1111-1111-1111-111111111105",
};

// Production Clean Slate: 0 Fake Lessons
export const MOCK_LESSONS: Lesson[] = [];

// Production Clean Slate: 0 Fake Books
export const MOCK_BOOKS: Book[] = [];

