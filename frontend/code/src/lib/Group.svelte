<script>
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"

    const groupID = window.location.pathname.split("/").pop()

    const fetchGroupPromise = fetch("http://localhost:8080/group/" + groupID, {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })
</script>

{#await fetchGroupPromise}

    <Loader/>

{:then response}

    {#await response.json() then response}

        <h1>{response[0].groupName}</h1>
        <img alt="Group Pic"> <!--Placeholder-->
        <button>Edit group (owner)</button>
        <p>TODO: Rest of the page :)</p>

    {/await}

{:catch error}
    
    {console.log(error)}
    <p>Something went wrong, try again later.</p>

{/await}