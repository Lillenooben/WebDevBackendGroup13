
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
    (1, 1, "Jesper1nick", FALSE, TRUE),
    (1, 2, "Jesper2nick", TRUE, TRUE),
    (1, 3, "Jesper3nick", FALSE, TRUE),
    (1, 4, "Jesper4nick", FALSE, FALSE),
    (2, 1, "Joakim1nick", TRUE, TRUE),
    (2, 2, "Joakim2nick", FALSE, TRUE),
    (2, 3, "Joakim3nick", FALSE, TRUE),
    (2, 4, "Joakim4nick", FALSE, FALSE),
    (3, 1, "Axel1nick", FALSE, TRUE),
    (3, 2, "Axel2nick", FALSE, TRUE),
    (3, 3, "Axel3nick", TRUE, TRUE),
    (3, 4, "Axel4nick", FALSE, FALSE),
    (4, 4, "Dummy4nick", TRUE, FALSE);

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
    (4, 5, TRUE);