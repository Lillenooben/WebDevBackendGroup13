CREATE TABLE IF NOT EXISTS user (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(14) unique,
    password CHAR(72),
    image MEDIUMTEXT
);

CREATE TABLE IF NOT EXISTS `group` (
    groupID INT PRIMARY KEY AUTO_INCREMENT,
    ownerID INT,
    name VARCHAR(20),
    image MEDIUMTEXT,
    memberCount INT,
    eventCount INT,
    messageCount INT,
    FOREIGN KEY (ownerID) REFERENCES user(userID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS userGroupConnection (
    userID INT,
    groupID INT,
    isOwner BOOLEAN,
    readMessageCount INT,
    UNIQUE (userID, groupID),
    FOREIGN KEY (userID) REFERENCES user(userID) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES `group`(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invitation (
    userID INT,
    groupID INT,
    UNIQUE (userID, groupID),
    FOREIGN KEY (userID) REFERENCES user(userID) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES `group`(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event (
    eventID INT PRIMARY KEY AUTO_INCREMENT,
    groupID INT,
    title TEXT(20),
    description TEXT(150),
    date DATETIME,
    FOREIGN KEY (groupID) REFERENCES `group`(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS userEventConnection (
    userID INT,
    eventID INT,
    FOREIGN KEY (userID) REFERENCES user(userID) ON DELETE CASCADE,
    FOREIGN KEY (eventID) REFERENCES event(eventID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message (
    messageID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    groupID INT,
    body VARCHAR(255),
    FOREIGN KEY (userID) REFERENCES user(userID) ON DELETE CASCADE
);

CREATE TRIGGER increment_members
AFTER INSERT ON userGroupConnection
FOR EACH ROW
UPDATE `group` SET `group`.memberCount = `group`.memberCount+1 WHERE `group`.groupID = NEW.groupID;

CREATE TRIGGER decrement_members
AFTER DELETE ON userGroupConnection
FOR EACH ROW
UPDATE `group` SET `group`.memberCount = `group`.memberCount-1 WHERE groupsTable.groupID = OLD.groupID;

CREATE TRIGGER increment_events
AFTER INSERT ON event
FOR EACH ROW
UPDATE `group` SET `group`.eventCount = `group`.eventCount+1 WHERE `group`.groupID = NEW.groupID;

CREATE TRIGGER decrement_events
AFTER DELETE ON event
FOR EACH ROW
UPDATE `group` SET `group`.eventCount = `group`.eventCount-1 WHERE `group`.groupID = OLD.groupID;

CREATE TRIGGER increment_messages
AFTER INSERT ON message
FOR EACH ROW
UPDATE `group` SET `group`.messageCount = `group`.messageCount+1 WHERE `group`.groupID = NEW.groupID;