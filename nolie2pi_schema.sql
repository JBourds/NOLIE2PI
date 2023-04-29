SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nolie2pi`
--

-- --------------------------------------------------------

--
-- Table structure for table `GSR_Data`
--

CREATE TABLE `GSR_Data` (
  `gsr_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `reading` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `HR_Data`
--

CREATE TABLE `HR_Data` (
  `hr_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `reading` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `SPO2_Data`
--

CREATE TABLE `SPO2_Data` (
  `spo2_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `reading` float DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `Tests`
--

CREATE TABLE `Tests` (
  `test_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `Test_Questions`
--

CREATE TABLE `Test_Questions` (
  `question_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `question` text,
  `pass` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE `Users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `GSR_Data`
--
ALTER TABLE `GSR_Data`
  ADD PRIMARY KEY (`gsr_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `HR_Data`
--
ALTER TABLE `HR_Data`
  ADD PRIMARY KEY (`hr_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `SPO2_Data`
--
ALTER TABLE `SPO2_Data`
  ADD PRIMARY KEY (`spo2_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `Tests`
--
ALTER TABLE `Tests`
  ADD PRIMARY KEY (`test_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `Test_Questions`
--
ALTER TABLE `Test_Questions`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `test_id` (`test_id`);

--
-- Indexes for table `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `GSR_Data`
--
ALTER TABLE `GSR_Data`
  MODIFY `gsr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `HR_Data`
--
ALTER TABLE `HR_Data`
  MODIFY `hr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SPO2_Data`
--
ALTER TABLE `SPO2_Data`
  MODIFY `spo2_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Tests`
--
ALTER TABLE `Tests`
  MODIFY `test_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Test_Questions`
--
ALTER TABLE `Test_Questions`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Users`
--
ALTER TABLE `Users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `GSR_Data`
--
ALTER TABLE `GSR_Data`
  ADD CONSTRAINT `GSR_Data_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `Test_Questions` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `HR_Data`
--
ALTER TABLE `HR_Data`
  ADD CONSTRAINT `HR_Data_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `Test_Questions` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SPO2_Data`
--
ALTER TABLE `SPO2_Data`
  ADD CONSTRAINT `SPO2_Data_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `Test_Questions` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Tests`
--
ALTER TABLE `Tests`
  ADD CONSTRAINT `Tests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Test_Questions`
--
ALTER TABLE `Test_Questions`
  ADD CONSTRAINT `Test_Questions_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `Tests` (`test_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
