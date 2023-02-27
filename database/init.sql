/*CREATE TABLE IF NOT EXISTS humans (
	id INT PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(50)
);

INSERT INTO humans (name) VALUES ('Alice'); */

/*"user1": {
            "userID": 1,
            "username": "Jesper",
            "password": "abc123",
            "profilePicture": "insertURL",
            "isActive": true
        }*/

CREATE TABLE IF NOT EXISTS usersTable (
	userID INT PRIMARY KEY AUTO_INCREMENT,
	username VARCHAR(14),
	userPassword VARCHAR(20),
    profilePicture BLOB,
    isActive BOOLEAN
);

CREATE TABLE IF NOT EXISTS groupsTable (
    groupID INT PRIMARY KEY AUTO_INCREMENT,
    groupName VARCHAR(20),
    groupImage BLOB,
);

CREATE TABLE IF NOT EXISTS userGroupConTable (
    userID INT,
    groupID INT,
    nickname VARCHAR(14),
    isOwner BOOLEAN,
    notifEnabled BOOLEAN,
    FOREIGN KEY (userID) REFERENCES usersTable(userID),
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID)
);

CREATE TABLE IF NOT EXISTS invitationsTable (
    userID INT,
    groupID INT,
    FOREIGN KEY (userID) REFERENCES usersTable(userID),
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID)
);

CREATE TABLE IF NOT EXISTS eventsTable (
    eventID INT PRIMARY KEY AUTO_INCREMENT,
    groupID INT,
    eventTitle TEXT(20),
    eventDesc TEXT(50),
    eventDate DATETIME,
    FOREIGN KEY (groupID) REFERENCES groupsTable(groupID)
);

CREATE TABLE IF NOT EXISTS userEventConTable (
    userID INT,
    eventID INT,
    isOptIn BOOLEAN,
    FOREIGN KEY (userID) REFERENCES usersTable(userID),
    FOREIGN KEY (eventID) REFERENCES eventsTable(groupID)
);

BEGIN
INSERT INTO usersTable (username, userPassword)
VALUES
    ("Jesper", "abc123"),
    ("Joakim", "abc123"),
    ("Axel", "abc123"),
    ("Dummy", "abc123");


INSERT INTO groupsTable (groupName)
VALUES
    ("AndroidGroup14"),
    ("MiscGroup"),
    ("MiscGroup2"),
    ("DummyOwnedGroup");

INSERT INTO userGroupConTable (userID, groupID, nickname, isOwner, notifEnabled)
VALUES
    (1, 1, "JesperGroup1nick", FALSE, TRUE),
    (1, 2, "JesperGroup2nick", TRUE, TRUE),
    (1, 3, "JesperGroup3nick", FALSE, TRUE),
    (1, 4, "JesperGroup4nick", FALSE, FALSE),
    (2, 1, "JoakimGroup1nick", TRUE, TRUE),
    (2, 2, "JoakimGroup2nick", FALSE, TRUE),
    (2, 3, "JoakimGroup3nick", FALSE, TRUE),
    (2, 4, "JoakimGroup4nick", FALSE, FALSE),
    (3, 1, "AxelGroup1nick", FALSE, TRUE),
    (3, 2, "AxelGroup2nick", FALSE, TRUE),
    (3, 3, "AxelGroup3nick", TRUE, TRUE),
    (3, 4, "AxelGroup4nick", FALSE, FALSE),
    (4, 4, "DummyGroup4nick", TRUE, FALSE);

INSERT INTO eventsTable (eventID, groupID, eventTitle, eventDesc, eventDate)
VALUES
    (1, 1, "This is a Title", "This is a short description of the event.", "2023-06-12 13:00:00"),
    (2, 1, "This is a Title2", "This is a short description of the event.", "2023-06-13 13:00:00"),
    (3, 2, "This is a Title3", "This is a short description of the event.", "2023-06-14 13:00:00"),
    (4, 3, "This is a Title4", "This is a short description of the event.", "2023-06-15 13:00:00"),
    (5, 4, "This is a Title5", "This is a short description of the event.", "2023-06-16 13:00:00");

INSERT INTO userEventConTable(userID, eventID, isOptIn)
VALUES
    (1, 1, TRUE),
    (1, 2, FALSE),
    (1, 3, FALSE),
    (1, 4, FALSE),
    (1, 5, TRUE),
    (2, 1, TRUE),
    (2, 2, FALSE),
    (2, 3, FALSE),
    (2, 4, FALSE),
    (2, 5, TRUE),
    (3, 1, TRUE),
    (3, 2, FALSE),
    (3, 3, FALSE),
    (3, 4, FALSE),
    (3, 5, FALSE),
    (4, 5, TRUE),

