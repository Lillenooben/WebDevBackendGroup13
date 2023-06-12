<script>
    import Loader from "./Loader.svelte"
    import { user } from "../user-store.js"
    import { onMount } from "svelte"

    export let groupID

    let error = ""
    let inviteError = ""
    let loading = false

    let username = ""
    let isOwner = false

    let fetchMembersPromise = fetch("http://localhost:8080/group/" + groupID + "/members", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        }
    })

    async function checkIfOwner() {
        const response = await fetch("http://localhost:8080/group/" + groupID + "?userID=" + $user.userID, {
            method: "GET",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            }
        })

        const body = await response.json()

        if (response.status == 200) {
            if (body.group.ownerID == $user.userID) {
                isOwner = true
            }
        } else {
            error = body.error
        }
    }

    onMount(async () => {
		checkIfOwner()
	})

    async function createInvite(){
        inviteError = ""
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
            inviteError = "Invitation sent!"
            username = ""
            loading = false
        } else {
            const body = await response.json()
            inviteError = body.error
            loading = false
        }
    }

    async function kickMember(userID) {

        const response = await fetch(`http://localhost:8080/group/${groupID}/member?requestUserID=${$user.userID}&deleteUserID=${userID}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer "+$user.accessToken,
            }
        })

        if (response.status == 204) {
            fetchMembersPromise = fetch("http://localhost:8080/group/" + groupID + "/members", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer "+$user.accessToken,
                }
            })
        } else {
            const body = await response.json()
            error = body.error
        }
    }
</script>

{#if isOwner}
    <form class="invite-form" on:submit|preventDefault={createInvite}>
        <h2>Add member</h2>

            {#if loading}
                <Loader/>
            {/if}

            <p>{inviteError}</p>

        <div>
            <label for="username">Username: </label>
            <input type="text" name="username" bind:value={username}>
        </div>
        
        <button type="submit" class="submit-button">Send invite</button>
    </form>
{/if}

<p class="error-text">{error}</p>

{#await fetchMembersPromise}
    <Loader/>
{:then response}
    {#await response.json() then response}
        
        <h1>Members</h1>

        <div class="member-wrapper">
            {#each response.membersArray as member}

                <div class="member-card">
                    {#if member.image == ""}
                        <img class="avatar" src="/userAvatar.png" alt="placeholder avatar"/>
                    {:else}
                        <img class="avatar" src={member.image} alt="avatar"/>
                    {/if}
                    <h2>{member.name}</h2>

                    {#if isOwner && member.userID != $user.userID}
                        <div class="button-wrapper">
                            <button class="text-button" on:click={() => kickMember(member.userID)}>Kick</button>
                        </div>
                    {/if}
                </div>
                
            {/each}
        </div>

    {/await}
{/await}

<style>
    .invite-form {
        background-color: #b8b8b8;
        width: 30em;
        margin: 1em auto 0 auto;
        border: 2px solid black;
        padding-bottom: 1em;
    }
    .member-wrapper {
        display: flex;
    }
    .member-card {
        background-color: #b8b8b8;
        width: 15em;
        margin: 0 1em 0 1em;
        padding-top: 0.5em;
        border: 2px solid black;
        position: relative;
    }
    .member-card h2 {
        margin: 0 0 0.5em 0;
    }
    .avatar {
        height: 75px;
        width: 75px;
        align-self: center;
        background-color: white;
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