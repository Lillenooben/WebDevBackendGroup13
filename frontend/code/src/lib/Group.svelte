<script>
    import { navigate } from "svelte-routing";
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

        {#if response.isOwner}
            <button>Edit group (owner)</button>

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

        <p>TODO: Rest of the page</p>

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
        margin-top: 0.2em;
    }
    .error-text {
        color: red
    }
    .submit-button {
        margin-top: 0.5em;
    }
    form {
        background-color: rgb(153, 152, 152);
        margin-bottom: 1em;
    }
</style>