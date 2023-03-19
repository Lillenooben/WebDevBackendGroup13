<script>
    import { navigate } from "svelte-routing";
    import { each } from "svelte/internal";
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"

    const groupID = window.location.pathname.split("/").pop()
    let username = ""

    let loading = false
    let inviteResponseMessage = ""
    let deleteError = ""

    const fetchGroupPromise = fetch("http://localhost:8080/group/" + groupID, {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    const fetchEventsPromise = fetch("http://localhost:8080/group/" + groupID +"/events", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
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

        <section>
            <div>
                <h2 class="header-inline">Upcoming Events</h2>
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
                        <section class="card-wrapper">
                            {#each response.eventsArray as event}
                                <div class="group-card">
                                    <h2 class="card-header">{event.eventTitle}</h2>
                                    <h3 class="card-header">{event.eventDate.split('T')[0]} {event.eventDate.split('T')[1].slice(0, 5)}</h3>
                                    {#if (event.eventDesc != "")}
                                        <p>{event.eventDesc}</p>
                                    {:else}
                                        <i>No description</i>
                                    {/if}
                                </div>
                            {/each}
                        </section>
                    {/if}
                {/await}
            {/await}
        </section>

        {#if response.isOwner}

            <form on:submit|preventDefault={createInvite}> <!--TODO: make it look nicer-->
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

            <button on:click={deleteGroup}>Delete Group</button>
        {:else}
            <button on:click={leaveGroup}>Leave Group</button> 
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
    .error-text {
        color: red
    }
    .submit-button {
        margin-top: 0.5em;
    }
    form {
        background-color: #92A1B3;
        margin-bottom: 1em;
    }
    .header-inline {
        display: inline-block;
    }
    .group-card {
        position: relative;
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
    .group-card:last-of-type {
        margin-bottom: 1em;
    }
    .card-header {
        margin: 0.2em 0 0 0;
    }
</style>