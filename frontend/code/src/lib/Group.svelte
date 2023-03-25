<script>
    import { Link, navigate } from "svelte-routing";
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"
    import { onDestroy, onMount } from "svelte"

    const groupID = window.location.pathname.split("/").pop()

    let deleteErrorGroup = ""
    let deleteErrorEvent = ""

    let chatMsg = ""
    let chatError = ""
    let pollError = ""
    let timeout

    let messages = []

    const fetchGroupPromise = fetch("http://localhost:8080/group/" + groupID + "?userID=" + $user.userID, {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    let fetchEventsPromise = fetch("http://localhost:8080/group/" + groupID + "/events", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    async function pollMessages(){
        pollError = ""
        
        const response = await fetch("http://localhost:8080/group/" + groupID + "/chat?userID=" + $user.userID, {
            method: "GET",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        const body = await response.json()

        if (response.status == 200) {
            messages = body.messages
        } else {
            pollError = body.error
        }

        timeout = setTimeout(pollMessages, 1000)
    }

    onMount(async () => {
		pollMessages()
	})

    onDestroy(async () => {
        clearTimeout(timeout)
    })

    async function leaveGroup(){
        deleteErrorGroup = ""

        if (!confirm("Are you sure you wish to leave the group?")) {
            return
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/leave?userID=" + $user.userID, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        if (response.status == 204) {
            navigate("../groups")

        } else {
            deleteErrorGroup = "Something went wrong, reload and try again."
        }
    }

    async function deleteGroup() {
        deleteErrorGroup = ""

        if (!confirm("Are you sure you wish to delete the group? \nThis cannot be undone!")) {
            return
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/delete?userID=" + $user.userID, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        if (response.status == 204) {
            navigate("../groups")

        } else {
            deleteErrorGroup = "Something went wrong, reload and try again."
        }
    }

    async function sendMessage() {
        chatError = ""

        const data = {
            message: chatMsg,
        }
        
        const response = await fetch("http://localhost:8080/group/" + groupID + "/chat?userID=" + $user.userID, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+$user.accessToken,
            },
            body: JSON.stringify(data)
        })

        if (response.status == 201) {
            chatMsg = ""
        } else {
            const body = await response.json()
            chatError = body.error
        }
    }

    async function deleteEvent(eventID) {

        const response = await fetch("http://localhost:8080/event/" + eventID + "/delete", {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        if (response.status == 204) {
            fetchEventsPromise = fetch("http://localhost:8080/group/" + groupID + "/events", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer "+$user.accessToken,
                },
            })
        } else {
            const body = await response.json()
            deleteErrorEvent = body.error
        }
    }

</script>

{#await fetchGroupPromise}
    <Loader/>
{:then response}

    {#await response.json() then response}

        {#if response.group.groupImage == ""}
            <img src="/groupAvatar.png" class="avatar" alt="Group Avatar">
        {:else}
            <img src={response.group.groupImage} class="avatar" alt="Group Avatar">
        {/if}

        <h1 class="title">{response.group.groupName}</h1>
        {#if response.isOwner}
            <button class="header-button" on:click={() => navigate(`/group/update/${response.group.groupID}`)}>Edit group</button>
        {/if}
        <button class="header-button" on:click={() => navigate(`/group/${response.group.groupID}/members`)}>Members</button>

        <div class="content-wrapper">

            <div class="half-width">
                <div>
                    <h2 class="section-header">Upcoming Events</h2>
                    {#if response.isOwner}
                        <button on:click={() => navigate(`/create-event/${response.group.groupID}`)}>Create event</button>
                    {/if}
                </div>
                <p class="error-text">{deleteErrorEvent}</p>

                {#await fetchEventsPromise}
                    <Loader/>
                {:then eResponse}

                    {#await eResponse.json() then eResponse}
                        {#if eResponse.eventsArray.length < 1}
                            <p>No scheduled events</p>
                        {:else}
                            {#each eResponse.eventsArray as event}
                                <div class="event-card">
                                    <h2 class="card-header">{event.eventTitle}</h2>
                                    <h3 class="card-header">{event.eventDate.split('T')[0]} {event.eventDate.split('T')[1].slice(0, 5)}</h3>
                                    {#if response.isOwner}
                                        <div class="button-wrapper">
                                            <Link to="event/update/{event.eventID}">Edit</Link>
                                            <button class="text-button" on:click={() => deleteEvent(event.eventID)}>Delete</button>
                                        </div>
                                    {/if}
                                    {#if (event.eventDesc != "")}
                                        <p>{event.eventDesc}</p>
                                    {:else}
                                        <i>No description</i>
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                    {/await}
                {/await}
            </div>

            <div class="half-width">

                <div id="chat-container">
                    <h2>Chat</h2>
                    <div id="chat-window">
                        {#each messages as message}
                            {#if $user.userID == message.userID}
                                <div class="chat-message user-chat">
                                    <strong>{message.username}</strong>
                                    <p class="chat-body">{message.message}</p>
                                </div>
                            {:else}
                                <div class="chat-message other-chat">
                                    <strong>{message.username}</strong>
                                    <p class="chat-body">{message.message}</p>
                                </div>
                            {/if}
                        {/each}
                    </div>

                    <form on:submit|preventDefault={sendMessage}>
                        <input type="text" bind:value={chatMsg} required/>
                        <button type="submit" class="submit-button">Send</button>
                        <p class="error-chat">{chatError}</p>
                    </form>

                </div>
            </div>
        </div>

        {#if response.isOwner}
            <button class="red-button" on:click={deleteGroup}>Delete Group</button>
        {:else}
            <button class="red-button" on:click={leaveGroup}>Leave Group</button> 
        {/if}
        <p class="error-text">{deleteErrorGroup}</p>

    {/await}

{:catch error}
    
    {console.log(error)}
    <p>Something went wrong, try again later.</p>

{/await}

<style>
    .avatar {
        margin-top: 1em;
    }
    .title {
        display: inline-block;
        vertical-align: top;
        margin: 0.75em 0 0 0.2em
    }
    .header-button {
        display: inline-block;
        vertical-align: top;
        margin: 3.5em 0 0 1em
    }
    .event-card {
        position: relative;
        flex-grow: 0;
        column-gap: 4em;
        border-radius: 25px;
        border: 3px solid #646cff;
        background-color: white;
        padding: 0.75em 1em 0em 1em;
        margin: 1em auto 0;
        width: 30em;
        min-height: 10em;
        word-wrap: break-word;
        will-change: filter;
        transition: filter 300ms;
    }
    .event-card:last-of-type {
        margin-bottom: 1em;
    }
    .card-header {
        margin: 0.2em 0 0 0;
    }
    .red-button {
        background-color: red;
    }
    .content-wrapper {
        display: flex;
        flex-wrap: wrap;
    }
    .half-width {
        width: 50%;
    }
    .section-header {
        display: inline-block;
    }
    #chat-container {
        margin: 1em;
        background-color: #b8b8b8;
        border-radius: 25px;
        border: 2px solid black;
        height: 30em;
    }
    #chat-container h2 {
        margin: 0;
    }
    #chat-window {
        background-color: white;
        margin: 0em auto auto auto;
        width: 95%;
        height: 74%;
        border: 2px solid black;
        overflow: auto;
        display: flex;
        flex-direction: column-reverse;
        word-wrap: break-word;
    }
    .chat-message {
        margin: 0.4em 1em;
        padding: 0 0.5em;
        border: 1px solid black;
        border-radius: 10px;
        text-align: left;
        color: black;
    }
    .chat-body {
        margin: 0 0 0.5em 0;
    }
    .user-chat {
        background-color: rgb(232, 172, 61);
        width: 25em;
        margin-left: auto;
    }
    .other-chat {
        background-color: rgb(209, 209, 209);
        width: 25em;
        margin-right: auto;
    }
    .error-chat {
        color: red;
        margin-top: 0;
    }
    .button-wrapper {
        position: absolute;
        right: 0;
        top: 0;
        margin-right: 0.5em;
    }
    .text-button {
        Border: 0px;
        background-color: rgba(255, 255, 255, 0);
        padding: 0;
        color: #3f46c4;
    }
    .text-button:hover {
        color: #0e17b3;
    }
</style>