<script>
    import { navigate } from "svelte-routing"
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"

    let menuOpen = false

    const fetchGroupsPromise = fetch("http://localhost:8080/user/groups", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    let fetchInvitesPromise = fetch("http://localhost:8080/group/invites", {
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

        fetch("http://localhost:8080/group/" + groupID + "/invite", {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        navigate(`/group/${groupID}`)
    }

    async function rejectInvitation(groupID){
        fetch("http://localhost:8080/group/" + groupID + "/invite", {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })

        fetchInvitesPromise = fetch("http://localhost:8080/group/invites", {
            method: "GET",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            },
        })
    }

</script>

<h1>My Groups</h1>

<section class="dropdown">
    <button on:click={() => menuOpen = !menuOpen}>{!menuOpen ? "Show pending invitations" : "Hide pending invitations"}</button>
      
    <div class:show={menuOpen} class="dropdown-content">		
    	{#await fetchInvitesPromise}
            <Loader/>
        {:then response}

            {#await response.json() then response}
            
                {#if response.invites.length < 1}
                    <p>No pending invites,</p>
                    <p>check back later!</p>
                {:else}
                    {#each response.invites as invite}
                        <div class="dropdown-row">
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

            {#if response.groupsArray.length < 1}
                <p>You are currently not in any groups</p>

            {:else}
                <section class="card-wrapper">
                    {#each response.groupsArray as group}

                        <button class="group-card" on:click={() => navigate(`/group/${group.groupID}`)}>
                            
                            {#if group.groupImage == ""}
                                <img class="avatar" src="/groupAvatar.png" alt="placeholder avatar"/>
                            {:else}
                                <img class="avatar" src={group.groupImage} alt="avatar"/>
                            {/if}

                            <h2 class="group-name">{group.groupName}</h2>

                            {#if group.isOwner}
                                <img class="owner-symbol" src="/ownerSymbol.png" alt="owner">
                            {/if}

                        </button>

                    {/each}
                </section>
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
        background-color: rgb(75, 235, 27);
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
        background-color: #92A1B3;
        border: 1px solid #ddd;
    }
    .show {
        display:block;
    }
    .card-wrapper {
        display: flex;
        margin: 0 auto;
        width: 60%;
        flex-wrap: wrap;
        justify-content: center;
    }
    .group-card {
        display: flex;
        position: relative;
        column-gap: 4em;
        border-radius: 25px;
        border: 3px solid #646cff;
        padding: 0em;
        padding-left: 1em;
        margin: 1em auto 0;
        width: 30em;
        height: 10em;
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
    .avatar {
        object-fit: cover;
        border: 3px solid #213547;
        border-radius: 50%;
        height: 100px;
        width: 100px;
        align-self: center;
    }
    .group-name {
        display: inline-block;
        color: #213547;
        align-self: center;
    }
    .owner-symbol {
        position: absolute;
        right: 0;
        width: 50px;
        height: 50px;
    }
</style>
