CREATE TABLE
  `course` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `course_code` varchar(255),
    `section_number` varchar(10),
    `faculty_initial` varchar(10),
    `total_seat` int DEFAULT 0,
    `remaining_seat` int DEFAULT 0,
    CONSTRAINT course_section UNIQUE (course_code, section_number)
  );

CREATE TABLE
  `student` (
    `email` varchar(255) PRIMARY KEY,
    `full_name` varchar(255)
  );

CREATE TABLE
  `enrollment` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `student_email` varchar(255),
    `course_id` int,
    CONSTRAINT student_course UNIQUE (student_email, course_id)
  );

ALTER TABLE `enrollment` ADD FOREIGN KEY (`course_id`) REFERENCES `course` (`id`);

ALTER TABLE `enrollment` ADD FOREIGN KEY (`student_email`) REFERENCES `student` (`email`);

CREATE TABLE
  `timing` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `day_of_week` varchar(10),
    `start_time` varchar(15),
    `end_time` varchar(15),
    `building_code` varchar(20),
    CONSTRAINT timing UNIQUE (day_of_week, start_time, end_time, building_code)
  );

CREATE TABLE
  `taken` (
    `id` int PRIMARY KEY AUTO_INCREMENT,
    `course_id` int,
    `timing_id` int,
    CONSTRAINT course_timing UNIQUE (course_id, timing_id),
    CONSTRAINT course_fk FOREIGN KEY (`course_id`) REFERENCES `course` (`id`),
    CONSTRAINT timing_fk FOREIGN KEY (`timing_id`) REFERENCES `timing` (`id`)
  );