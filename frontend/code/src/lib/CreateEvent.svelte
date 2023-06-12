<script>
    import Loader from "./Loader.svelte"
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing";

    export let groupID
    let loading = false
    let eventTitle = ""
    let eventDesc = ""
    let eventDate = ""
    let error = ""

    async function createEvent() {
        error = ""
        loading = true

        const data = {
            title: eventTitle,
            description: eventDesc,
            date: eventDate,
        }

        const response = await fetch("http://localhost:8080/group/" + groupID + "/event?userID=" + $user.userID, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+$user.accessToken,
            },
            body: JSON.stringify(data)
        })

        if (response.status == 201) {
            navigate(`/group/${groupID}`)

        } else {
            const body = await response.json()
            error = body.error
            loading = false
        }
    }
</script>

<h1>Create Event</h1>

<form on:submit|preventDefault={createEvent}>

    {#if loading}
        <Loader/>
    {/if}

    <p class="error-text">{error}</p>

    <div>
        <label for="name">Event name: </label>
        <input type="text" name="name" bind:value={eventTitle}>
    </div>

    <div>
        <label for="description">Description: </label>
        <input type="text" name="description" bind:value={eventDesc}>
    </div>

    <div>
        <label for="date">Event date: </label>
        <input type="datetime-local" name="date" bind:value={eventDate} required>
    </div>
    
    <button type="submit" class="submit-button">Create</button>
</form>