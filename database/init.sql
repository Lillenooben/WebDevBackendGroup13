CREATE TABLE IF NOT EXISTS usersTable (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(14) unique,
    userPassword CHAR(72),
    profileImage MEDIUMTEXT,
    isActive BOOLEAN
);

CREATE TABLE IF NOT EXISTS groupsTable (
    groupID INT PRIMARY KEY AUTO_INCREMENT,
    ownerID INT,
    groupName VARCHAR(20),
    groupImage MEDIUMTEXT,
    memberCount INT,
    eventCount INT,
    messageCount INT,
    FOREIGN KEY (ownerID) REFERENCES usersTable(userID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS userGroupConTable (
    userID INT,
    groupID INT,
    isOwner BOOLEAN,
    notifEnabled BOOLEAN,
    prevMessageCount INT,
    FOREIGN KEY (userID) REFERENCES usersTable(userID) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invitationsTable (
    userID INT,
    groupID INT,
    UNIQUE (userID, groupID),
    FOREIGN KEY (userID) REFERENCES usersTable(userID) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS eventsTable (
    eventID INT PRIMARY KEY AUTO_INCREMENT,
    groupID INT,
    eventTitle TEXT(20),
    eventDesc TEXT(150),
    eventDate DATETIME,
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS userEventConTable (
    userID INT,
    eventID INT,
    isOptIn BOOLEAN,
    FOREIGN KEY (userID) REFERENCES usersTable(userID) ON DELETE CASCADE,
    FOREIGN KEY (eventID) REFERENCES eventsTable(eventID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messagesTable (
    messageID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    groupID INT,
    message VARCHAR(255),
    FOREIGN KEY (userID) REFERENCES usersTable(userID) ON DELETE CASCADE
);

CREATE TRIGGER increment_members
AFTER INSERT ON userGroupConTable
FOR EACH ROW
UPDATE groupsTable SET groupsTable.memberCount = groupsTable.memberCount+1 WHERE groupsTable.groupID = NEW.groupID;

CREATE TRIGGER decrement_members
AFTER DELETE ON userGroupConTable
FOR EACH ROW
UPDATE groupsTable SET groupsTable.memberCount = groupsTable.memberCount-1 WHERE groupsTable.groupID = OLD.groupID;

CREATE TRIGGER increment_events
AFTER INSERT ON eventsTable
FOR EACH ROW
UPDATE groupsTable SET groupsTable.eventCount = groupsTable.eventCount+1 WHERE groupsTable.groupID = NEW.groupID;

CREATE TRIGGER decrement_events
AFTER DELETE ON eventsTable
FOR EACH ROW
UPDATE groupsTable SET groupsTable.eventCount = groupsTable.eventCount-1 WHERE groupsTable.groupID = OLD.groupID;

CREATE TRIGGER increment_messages
AFTER INSERT ON messagesTable
FOR EACH ROW
UPDATE groupsTable SET groupsTable.messageCount = groupsTable.messageCount+1 WHERE groupsTable.groupID = NEW.groupID;