<script>
    import { onMount } from "svelte"
    import Loader from "./Loader.svelte"
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing"

    export let eventID
    let groupID = ""

    let eventTitle = ""
    let eventDesc = ""
    let eventDate = ""

    let loading = false
    let error = ""

    async function updateEvent() {
        error = ""
        loading = true

        const data = {
            title: eventTitle,
            description: eventDesc,
            date: eventDate,
        }

        const response = await fetch("http://localhost:8080/event/" + eventID, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+$user.accessToken,
            },
            body: JSON.stringify(data)
        })

        if (response.status == 200) {
            navigate("/group/"+groupID)
        } else {
            const body = await response.json()
            error = body.error
            loading = false
        }
    }

    async function fetchEventInfo(){
        error = ""
        loading = true

        const response = await fetch("http://localhost:8080/event/" + eventID, {
            method: "GET",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        const body = await response.json()

        if (response.status == 200) {
            eventTitle = body.event.title
            eventDesc = body.event.description
            eventDate = body.event.date.split('.')[0]
            groupID = body.event.groupID
        } else {
            error = body.error
        }

        loading = false
    }

    onMount(async () => {
		fetchEventInfo()
	})
</script>

<h1>Update Event</h1>

<form on:submit|preventDefault={updateEvent}>

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
    
    <button type="submit" class="submit-button">Update</button>
</form>