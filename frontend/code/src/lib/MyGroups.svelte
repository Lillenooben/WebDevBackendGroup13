<script>
    import { Link, navigate } from "svelte-routing"
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"

    let menuOpen = false

    const fetchGroupsPromise = fetch("http://localhost:8080/user/groups", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    const fetchInvitesPromise = fetch("http://localhost:8080/group/invites", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    async function acceptInvitation(groupID){
        fetch("http://localhost:8080/group/" + groupID + "/invite/accept", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        rejectInvitation(groupID)
        navigate(`/group/${groupID}`)
    }

    async function rejectInvitation(groupID){
        fetch("http://localhost:8080/group/" + groupID + "/invite", {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })
    }

</script>

<h1>My Groups</h1>

<section class="dropdown">
    <button on:click={() => menuOpen = !menuOpen}>{!menuOpen ? "Show pending invitations" : "Hide pending invitations"}</button>
      
    <div id="myDropdown" class:show={menuOpen} class="dropdown-content">		
    	{#await fetchInvitesPromise}
            <Loader/>
        {:then response}

            {#await response.json() then response}
            
                {#if response.invites.length < 1}
                    <p>No pending invites,</p>
                    <p>check back later!</p>
                {:else}
                    {#each response.invites as invite}
                        <div class="dropdown-row"> <!--TODO: Figure out how to make the rows update when pressing buttons-->
                            {invite.groupName}
                            <button on:click={() => acceptInvitation(invite.groupID)} class="accept-button">&#10004;</button>
                            <button on:click={() => rejectInvitation(invite.groupID)} class="reject-button">X</button>
                        </div>
                    {/each}
                {/if}
            
            {/await}
        {:catch error}
            <p>Something went wrong, try again later.</p>
        {/await}
    </div>	
</section>

{#await fetchGroupsPromise}

    <Loader/>

{:then response}

    {#await response.json() then response}

            {#if response.groups.length < 1}
                <p>You are currently not in any groups</p>

            {:else}
                {#each response.groups as group}
                    <div>
                        <Link to="/group/{group.groupID}">{group.groupName}</Link>
                    </div>
                {/each}
            {/if}

    {/await}

{:catch error}
    
    <p>Something went wrong, try again later.</p>

{/await}

<style>
    .dropdown-row {
        text-align: right;
    }
    .accept-button {
        background-color: rgb(0, 179, 0);
        padding: 0.5em;
    }
    .reject-button {
        background-color: red;
        padding: 0.5em;
    }
    .dropdown {
      position: relative;
      display: inline-block;
    }  
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #e7e7e7;
      min-width: 250px;
      border: 1px solid #ddd;
      z-index: 1;
    }
    .show {
        display:block;
    }	
</style>
