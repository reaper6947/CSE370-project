CREATE TABLE
  `faculty` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `initial` varchar(50) UNIQUE
  );

CREATE TABLE
  `course` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `course_code` varchar(255),
    `description` varchar(255),
    `section_number` int,
    `faculty_id` int,
    `total_seat` int,
    `filled_seat` int,
    CONSTRAINT course_section UNIQUE (course_code, section_number)
  );

ALTER TABLE `course` ADD FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`);

CREATE TABLE
  `rooms` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `room_name` varchar(255) UNIQUE
  );

CREATE TABLE
  `student` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `full_name` varchar(255),
    `email` varchar(255),
    `password` varchar(255)
  );

CREATE TABLE
  `enrollment` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `student_id` int,
    `course_id` int
  );

ALTER TABLE `enrollment` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `enrollment` ADD FOREIGN KEY (`student_id`) REFERENCES `student` (`id`);

CREATE TABLE
  `course_rooms` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `course_id` int,
    `rooms_id` int
  );

ALTER TABLE `course_rooms` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `course_rooms` ADD FOREIGN KEY (`rooms_id`) REFERENCES `rooms` (`id`);

CREATE TABLE
  `days_per_week` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `course_id` int,
    `day` varchar(255),
    `time_id` int
  );

CREATE TABLE
  `course_days_per_week` (
    `course_id` int,
    `days_per_week_id` int,
    PRIMARY KEY (`course_id`, `days_per_week_id`)
  );

ALTER TABLE `course_days_per_week` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `course_days_per_week` ADD FOREIGN KEY (`days_per_week_id`) REFERENCES `days_per_week` (`id`);

CREATE TABLE
  `times_per_day` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `start_time` time,
    `end_time` time
  );

CREATE TABLE
  `days_per_week_times_per_day` (
    `days_per_week_time_id` int,
    `times_per_day_id` int,
    PRIMARY KEY (`days_per_week_time_id`, `times_per_day_id`)
  );

ALTER TABLE `days_per_week_times_per_day` ADD FOREIGN KEY (`days_per_week_time_id`) REFERENCES `days_per_week` (`time_id`);

ALTER TABLE `days_per_week_times_per_day` ADD FOREIGN KEY (`times_per_day_id`) REFERENCES `times_per_day` (`id`);