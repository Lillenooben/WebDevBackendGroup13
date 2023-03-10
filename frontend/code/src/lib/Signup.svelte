<script>
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing"

    //TODO: add loading (make a loader component)
    let username = ""
    let password = ""
    let confirmPassword = ""
    let errors = []

    function addError(message) {
        errors = [...errors, message]
    }

    //TODO: add more error handling and better error messages (perhaps using the error codes?) (username+password length)
    //TODO: add accessToken
    async function createAcc() {
        errors = []

        if (password != confirmPassword) {
            addError("Your passwords do not match")
            return
        }
        
        const data = {
            username: username,
            password: password
        }

        const response = await fetch("http://localhost:8080/user/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })

        switch (response.status) {
            case 200:
                $user.isLoggedIn = true
                navigate("/")
            case 400:
                addError("Something went wrong")
        }
    }
</script>

<h1>Create account</h1>

{#each errors as error}
    <p class="error-text">{error}</p>
{/each}

<form on:submit|preventDefault={createAcc}>

    <div>
        Username:
        <input type="text" bind:value={username}>
    </div>

    <div>
        Password:
        <input type="password" bind:value={password}>
    </div>

    <div>
        Confirm password:
        <input type="password" bind:value={confirmPassword}>
    </div>

    <input type="submit" value="Create">

</form>

<style>
    .error-text {
        color: red;
        margin: 0.2em;
    }
    p:last-of-type {
        margin-bottom: 1em;
    }
</style>