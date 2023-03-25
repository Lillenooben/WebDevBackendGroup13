<script>
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"
    import { navigate } from "svelte-routing"

    const fetchEventsPromise = fetch("http://localhost:8080/user/events?userID=" + $user.userID, {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

</script>

<h1>Welcome back, {$user.username}!</h1>
<h2>Here are your upcoming events:</h2>
{#await fetchEventsPromise}
    <Loader/>
{:then response}

    {#await response.json() then response}

        {#if response.eventsArray.length < 1}
            <p>There's nothing coming up right now,</p>
            <p>check back later!</p>
        {:else}

            <section class="card-wrapper">
                {#each response.eventsArray as event}
                    <button class="group-card" on:click={() => navigate(`/group/${event.groupID}`)}>
                        <i class="small-text">{event.groupName}</i>
                        <h2 class="card-header">{event.eventTitle}</h2>
                        <h3 class="card-header">{event.eventDate.split('T')[0]} {event.eventDate.split('T')[1].slice(0, 5)}</h3>
                        <p>{event.eventDesc}</p>
                    </button>
                {/each}
            </section>

        {/if}

    {/await}

{:catch error}
    <p>Something went wrong, try again later</p>
{/await}

<style>
    .card-wrapper {
        display: flex;
        margin: 0 auto;
        width: 60%;
        flex-wrap: wrap;
        justify-content: center;
    }
    .group-card {
        position: relative;
        column-gap: 4em;
        border-radius: 25px;
        border: 3px solid #646cff;
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
    .group-card:hover {
        border: 3px solid #0e17b3;
        filter: drop-shadow(10px 10px 10px #464647ec);
    }
    .card-header {
        margin: 0.2em 0 0 0;
    }
    .small-text {
        margin: 0;
        position: absolute;
        top: 0;
        left: 2%;
        color: rgba(85, 85, 85, 0.664);
    }
</style>