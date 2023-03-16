<script>
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing"
    import Loader from "./Loader.svelte"

    const fetchUserPromise = fetch("http://localhost:8080/user/get", {
        method: "GET",
        headers: {
            "Authorization": "Bearer "+$user.accessToken,
        },
    })

    function logout() {
        $user = {
            isLoggedIn: false,
            accessToken: "",
        }
        navigate("/login")
    }
</script>

{#await fetchUserPromise}

    <Loader/>

{:then response}

    {#await response.json() then response}
    
        <h1>{response.username}</h1>
        <img alt="Profile"> <!--Placeholder-->
        <button>Edit image</button>
        
        <h2>Settings</h2>
        <p>Various account and notification settings go here</p>
        <button on:click={logout}>Log out</button>

    {/await}

{:catch error}
    {console.log(error)}
    <p>Something went wrong, try again later.</p>

{/await}