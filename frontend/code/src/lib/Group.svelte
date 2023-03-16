<script>
    import { user } from "../user-store.js"
    import Loader from "./Loader.svelte"

    const groupID = window.location.pathname.split("/").pop()
    let username = ""

    let loading = false
    let responseMessage = ""

    const fetchGroupPromise = fetch("http://localhost:8080/group/" + groupID, {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    async function createInvite(){
        responseMessage = ""
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
            responseMessage = "Invitation sent!"
            username = ""
            loading = false
        } else {
            const body = await response.json()
            responseMessage = body.error
            loading = false
        }
    }

</script>

<!--TODO: Make sure you can't access a group you aren't part of-->
{#await fetchGroupPromise}

    <Loader/>

{:then response}

    {#await response.json() then response}

        <h1>{response[0].groupName}</h1>
        <img alt="Group Pic"> <!--Placeholder-->
        <button>Edit group (owner)</button>

        <form on:submit|preventDefault={createInvite}> <!-- only show if user = owner -->
            <h2>Add member</h2>

                {#if loading}
                    <Loader/>
                {/if}

                <p>{responseMessage}</p>

            <div>
                <label for="username">Username: </label>
                <input type="text" name="username" bind:value={username}>
            </div>
            
            <button type="submit" class="submit-button">Create</button>
        </form>

        <p>TODO: Rest of the page :)</p>

    {/await}

{:catch error}
    
    {console.log(error)}
    <p>Something went wrong, try again later.</p>

{/await}

<style>
    .submit-button {
        margin-top: 0.5em;
    }
    form {
        background-color: rgb(153, 152, 152);
    }
</style>