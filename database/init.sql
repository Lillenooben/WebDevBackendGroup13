CREATE TABLE IF NOT EXISTS usersTable (
    userID INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(14) unique,
    userPassword CHAR(72),
    profilePicture BLOB,
    isActive BOOLEAN
);

CREATE TABLE IF NOT EXISTS groupsTable (
    groupID INT PRIMARY KEY AUTO_INCREMENT,
    groupName VARCHAR(20),
    groupImage BLOB
);

CREATE TABLE IF NOT EXISTS userGroupConTable (
    userID INT,
    groupID INT,
    nickname VARCHAR(14),
    isOwner BOOLEAN,
    notifEnabled BOOLEAN,
    FOREIGN KEY (userID) REFERENCES usersTable(userID) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invitationsTable (
    userID INT,
    groupID INT,
    FOREIGN KEY (userID) REFERENCES usersTable(userID) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS eventsTable (
    eventID INT PRIMARY KEY AUTO_INCREMENT,
    groupID INT,
    eventTitle TEXT(20),
    eventDesc TEXT(50),
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