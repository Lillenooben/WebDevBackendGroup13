<script>
    import { Link } from "svelte-routing"
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"

    const fetchGroupsPromise = fetch("http://localhost:8080/user/groups", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

</script>

<h1>My Groups</h1>

{#await fetchGroupsPromise}

    <Loader/>

{:then response}

    {#await response.json() then response}

            {#if response.groups.length < 1}
                <p>You are currently not in any groups</p>
            {/if}

            {#each response.groups as group}
                <div>
                    <Link to="/group/{group.groupID}">{group.groupName}</Link>
                </div>
            {/each}

    {/await}

{:catch error}
    
    <p>Something went wrong, try again later.</p>

{/await}
