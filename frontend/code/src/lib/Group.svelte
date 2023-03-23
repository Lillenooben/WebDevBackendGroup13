<script>
    import { navigate } from "svelte-routing";
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"
    import { onDestroy, onMount } from "svelte"

    const groupID = window.location.pathname.split("/").pop()
    let username = ""

    let loading = false
    let inviteResponseMessage = ""
    let deleteError = ""

    let chatMsg = ""
    let chatError = ""
    let pollError = ""
    let timeout

    let messages = []

    const fetchGroupPromise = fetch("http://localhost:8080/group/" + groupID, {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    const fetchEventsPromise = fetch("http://localhost:8080/group/" + groupID + "/events", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    let fetchMessagesPromise = fetch("http://localhost:8080/group/" + groupID + "/chat", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    async function pollMessages(){
        pollError = ""

        const response = await fetch("http://localhost:8080/group/" + groupID + "/chat", {
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

    async function createInvite(){
        inviteResponseMessage = ""
        loading = true

        const data = {
            username: username,
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/invite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+$user.accessToken,
            },
            body: JSON.stringify(data)
        })

        if (response.status == 201) {
            inviteResponseMessage = "Invitation sent!"
            username = ""
            loading = false
        } else {
            const body = await response.json()
            inviteResponseMessage = body.error
            loading = false
        }
    }

    async function leaveGroup(){
        deleteError = ""

        if (!confirm("Are you sure you wish to leave the group?")) {
            return
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/leave", {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        if (response.status == 204) {
            navigate("../groups")

        } else {
            deleteError = "Something went wrong, reload and try again."
        }
    }

    async function deleteGroup() {
        deleteError = ""

        if (!confirm("Are you sure you wish to delete the group? \nThis cannot be undone!")) {
            return
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/delete", {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        if (response.status == 204) {
            navigate("../groups")

        } else {
            deleteError = "Something went wrong, reload and try again."
        }
    }

    async function sendMessage() {
        chatError = ""

        const data = {
            message: chatMsg,
        }
        
        const response = await fetch("http://localhost:8080/group/" + groupID + "/chat", {
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

</script>

<!--TODO: Make sure you can't access a group you aren't part of-->
{#await fetchGroupPromise}
    <Loader/>
{:then response}

    {#await response.json() then response}

        {#if response.group.groupImage == ""}
            <img src="/groupAvatar.png" class="avatar" alt="Group Avatar">
        {:else}
            <img src={response.group.groupImage} class="avatar" alt="Group Avatar">
        {/if}

        <h1 id="title">{response.group.groupName}</h1>
        {#if response.isOwner}
            <button class="edit-button" on:click={() => navigate(`/group/update/${response.group.groupID}`)}>Edit group</button>
        {/if}

        <div class="content-wrapper">

            <div class="half-width">
                <div>
                    <h2 class="section-header">Upcoming Events</h2>
                    {#if response.isOwner}
                        <button on:click={() => navigate(`/create-event/${response.group.groupID}`)}>Create event</button>
                    {/if}
                </div>

                {#await fetchEventsPromise}
                    <Loader/>
                {:then response}

                    {#await response.json() then response}
                        {#if response.eventsArray.length < 1}
                            <p>No scheduled events</p>
                        {:else}
                            {#each response.eventsArray as event}
                                <div class="event-card">
                                    <h2 class="card-header">{event.eventTitle}</h2>
                                    <h3 class="card-header">{event.eventDate.split('T')[0]} {event.eventDate.split('T')[1].slice(0, 5)}</h3>
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
                    <h2 class="section-header">Messageboard</h2>
                    <div id="chat-window">
                        {#each messages as message}
                            <div class="chat-message">
                                <p class="chat-text"><strong class="sender-name">{message.username}</strong>: {message.message}</p>
                            </div>
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

            <form class="invite-form" on:submit|preventDefault={createInvite}> <!--TODO: make it look nicer-->
                <h2>Add member</h2>

                    {#if loading}
                        <Loader/>
                    {/if}

                    <p>{inviteResponseMessage}</p>

                <div>
                    <label for="username">Username: </label>
                    <input type="text" name="username" bind:value={username}>
                </div>
                
                <button type="submit" class="submit-button">Send invite</button>
            </form>

            <button class="red-button" on:click={deleteGroup}>Delete Group</button>
        {:else}
            <button class="red-button" on:click={leaveGroup}>Leave Group</button> 
        {/if}
        <p class="error-text">{deleteError}</p>

    {/await}

{:catch error}
    
    {console.log(error)}
    <p>Something went wrong, try again later.</p>

{/await}

<style>
    .avatar {
        object-fit: cover;
        border: 3px solid #213547;
        border-radius: 50%;
        height: 100px;
        width: 100px;
        margin-top: 1em;
    }
    #title {
        display: inline-block;
        vertical-align: top;
        margin: 0.75em 0 0 0.2em
    }
    .edit-button {
        display: inline-block;
        vertical-align: top;
        margin: 3.5em 0 0 1em
    }
    .error-text {
        color: red
    }
    .submit-button {
        margin-top: 0.5em;
    }
    .invite-form {
        background-color: #92A1B3;
        margin-bottom: 1em;
    }
    .event-card {
        position: relative;
        flex-grow: 0;
        column-gap: 4em;
        border-radius: 25px;
        border: 3px solid #646cff;
        background-color: white;
        padding: 0em;
        padding: 0em 1em 0em 1em;
        margin: 1em auto 0;
        width: 30em;
        height: 10em;
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
        background-color: #92A1B3;
        border-radius: 25px;
        border: 2px solid black;
        height: 29em;
    }
    #chat-window {
        background-color: white;
        width: 80%;
        height: 65%;
        margin: auto;
        border: 2px solid black;
        overflow: auto;
        display: flex;
        flex-direction: column-reverse;
        word-wrap: break-word;
    }
    .chat-message {
        margin: 0.4em 1em;
        padding: 0 0.5em;
        background-color: rgb(168, 168, 168);
        border: 1px solid black;
        border-radius: 10px;
        text-align: left;
    }
    .chat-text {
        color: black;
    }
    input[type=text] {
        width: 20em;
        padding: 8px 14px;
        margin: 8px 0;
        box-sizing: border-box;
    }
    .error-chat {
        color: red;
        margin-top: 0;
    }
</style>